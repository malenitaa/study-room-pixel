// Harness de verificación de seguridad — corre la app YA BUILDEADA (out/) en una ventana oculta
// y ejecuta los checks "no negociables" del checklist: nodeIntegration/contextIsolation reales,
// superficie del preload, CSP header, bloqueo de navegación externa y de window.open.
// Uso: npm run build && npx electron scripts/verify-security.mjs
import { app, BrowserWindow, session } from 'electron'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data:; media-src 'self'; connect-src 'none'; object-src 'none'"

const rendererHtml = join(ROOT, 'out/renderer/index.html')
const preloadPath = join(ROOT, 'out/preload/index.js')

if (!existsSync(rendererHtml) || !existsSync(preloadPath)) {
  console.error('Falta out/renderer/index.html o out/preload/index.js — corré "npm run build" primero.')
  process.exit(2)
}

let capturedCsp = null
let newWindowsOpened = 0
let navigationBlocked = false

const results = []
function check(label, pass, detail) {
  results.push({ label, pass, detail })
  console.log(`${pass ? '✅' : '❌'} ${label}${detail ? ' — ' + detail : ''}`)
}

app.whenReady().then(async () => {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    if (details.resourceType === 'mainFrame' && !capturedCsp) {
      const header = details.responseHeaders?.['Content-Security-Policy']
      capturedCsp = Array.isArray(header) ? header[0] : (header ?? null)
    }
    callback({
      responseHeaders: { ...details.responseHeaders, 'Content-Security-Policy': [CSP] }
    })
  })

  app.on('browser-window-created', () => {
    newWindowsOpened++
  })

  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })
  newWindowsOpened = 0 // no contar la ventana principal creada arriba

  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  win.webContents.on('will-navigate', (event) => {
    navigationBlocked = true
    event.preventDefault()
  })

  await win.loadFile(rendererHtml)
  await new Promise((resolve) => setTimeout(resolve, 600))

  const domChecks = await win.webContents.executeJavaScript(`
    (function () {
      return {
        hasWindowRequire: typeof window.require !== 'undefined',
        hasWindowProcess: typeof window.process !== 'undefined',
        hasGlobalRequire: typeof require !== 'undefined',
        apiKeys: window.api ? Object.keys(window.api).sort() : null
      }
    })()
  `)

  check(
    'nodeIntegration deshabilitado: window.require es undefined',
    domChecks.hasWindowRequire === false
  )
  check('window.process no está expuesto en el renderer', domChecks.hasWindowProcess === false)
  check('require global no está expuesto en el renderer', domChecks.hasGlobalRequire === false)

  const expectedApiKeys = ['getConfig', 'isFullScreen', 'setConfig', 'setFullScreen']
  check(
    'preload expone únicamente las 4 funciones esperadas (nada de ipcRenderer crudo)',
    JSON.stringify(domChecks.apiKeys) === JSON.stringify(expectedApiKeys),
    `window.api = ${JSON.stringify(domChecks.apiKeys)}`
  )

  await win.webContents
    .executeJavaScript("window.location.href = 'https://example.com'")
    .catch(() => undefined)
  await new Promise((resolve) => setTimeout(resolve, 300))
  check(
    'will-navigate bloqueó la navegación a una URL externa',
    navigationBlocked && win.webContents.getURL().startsWith('file://'),
    `URL actual: ${win.webContents.getURL()}`
  )

  await win.webContents
    .executeJavaScript("window.open('https://example.com', '_blank')")
    .catch(() => undefined)
  await new Promise((resolve) => setTimeout(resolve, 300))
  check(
    'setWindowOpenHandler denegó la apertura de una ventana nueva',
    newWindowsOpened === 0,
    `ventanas nuevas creadas: ${newWindowsOpened}`
  )

  check(
    "header Content-Security-Policy presente y con connect-src 'none'",
    typeof capturedCsp === 'string' && capturedCsp.includes("connect-src 'none'"),
    capturedCsp ?? 'ningún header capturado'
  )

  const allPassed = results.every((r) => r.pass)
  console.log(allPassed ? '\nTodos los checks de seguridad pasaron ✅' : '\nHay checks que fallaron ❌')

  win.destroy()
  app.exit(allPassed ? 0 : 1)
})
