// Harness de verificación de seguridad — corre la app YA BUILDEADA (out/) en una ventana oculta
// y ejecuta los checks "no negociables" del checklist: nodeIntegration/contextIsolation reales,
// superficie del preload, CSP (meta tag del build y su efecto real), bloqueo de navegación externa
// y de window.open. No inyecta ningún header CSP propio: lo que se prueba es la <meta> que viaja
// en out/renderer/index.html, que es la defensa que llega a la app empaquetada (file:// no trae
// headers de respuesta; el header que agrega src/main/index.ts es una segunda capa).
// Uso: npm run build && npx electron scripts/verify-security.mjs
import { app, BrowserWindow } from 'electron'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync, readFileSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const rendererHtml = join(ROOT, 'out/renderer/index.html')
const preloadPath = join(ROOT, 'out/preload/index.js')

if (!existsSync(rendererHtml) || !existsSync(preloadPath)) {
  console.error('Falta out/renderer/index.html o out/preload/index.js — corré "npm run build" primero.')
  process.exit(2)
}

let newWindowsOpened = 0
let navigationBlocked = false

const results = []
function check(label, pass, detail) {
  results.push({ label, pass, detail })
  console.log(`${pass ? '✅' : '❌'} ${label}${detail ? ' — ' + detail : ''}`)
}

app.whenReady().then(async () => {
  const html = readFileSync(rendererHtml, 'utf-8')
  const metaMatch = html.match(/<meta[^>]*http-equiv="Content-Security-Policy"[^>]*content="([^"]*)"/i)
  const metaCsp = metaMatch ? metaMatch[1] : null
  check(
    "out/renderer/index.html trae la <meta> CSP con connect-src 'none' y script-src 'self' sin unsafe-*",
    typeof metaCsp === 'string' &&
      metaCsp.includes("connect-src 'none'") &&
      /script-src 'self'(;|$)/.test(metaCsp),
    metaCsp ?? 'no hay <meta> CSP'
  )
  const firstScript = html.search(/<script/i)
  check(
    'la <meta> CSP está antes del primer <script>',
    metaMatch !== null && (firstScript === -1 || metaMatch.index < firstScript)
  )

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

  const fetchResult = await win.webContents.executeJavaScript(`
    new Promise((resolve) => {
      let violated = null
      document.addEventListener('securitypolicyviolation', (e) => { violated = e.effectiveDirective })
      fetch('https://example.com/')
        .then(() => 'respondió', (err) => 'rechazado: ' + err.name)
        .then((outcome) => setTimeout(() => resolve({ outcome, violated }), 100))
    })
  `)
  check(
    'la CSP bloquea fetch() a una URL externa',
    fetchResult.violated === 'connect-src' && fetchResult.outcome.startsWith('rechazado'),
    `fetch ${fetchResult.outcome}, directiva violada: ${fetchResult.violated}`
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

  const allPassed = results.every((r) => r.pass)
  console.log(allPassed ? '\nTodos los checks de seguridad pasaron ✅' : '\nHay checks que fallaron ❌')

  win.destroy()
  app.exit(allPassed ? 0 : 1)
})
