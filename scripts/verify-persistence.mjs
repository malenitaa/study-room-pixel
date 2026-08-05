// Harness de persistencia end-to-end: levanta la app YA BUILDEADA dos veces (procesos separados,
// de verdad) contra el mismo --user-data-dir de prueba, y la maneja por Chrome DevTools Protocol
// (--remote-debugging-port) para llamar window.api.setConfig()/getConfig() tal cual lo haría la UI.
// No reimplementa la lógica de guardado: pega contra el main process, preload e IPC reales.
//
// Uso: npm run build && node scripts/verify-persistence.mjs
import electronPath from 'electron'
import { spawn } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync, mkdirSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const MAIN_ENTRY = join(ROOT, 'out/main/index.js')
const SCRATCH_DIR = join(tmpdir(), 'study-room-pixel-verify-userdata')
const CDP_PORT = 9333

const EXPECTED = {
  scene: 'cafe',
  ambientVolume: 0.37,
  notifVolume: 0.82,
  lastDurationMs: 37 * 60 * 1000,
  alwaysOnTop: true
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function requireBuilt() {
  const missing = ['out/main/index.js', 'out/preload/index.js', 'out/renderer/index.html'].filter(
    (rel) => !existsSync(join(ROOT, rel))
  )
  if (missing.length > 0) {
    console.error(`Falta buildear: ${missing.join(', ')} — corré "npm run build" primero.`)
    process.exit(2)
  }
}

async function waitForCdp(port, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`)
      if (res.ok) return
    } catch {
      // todavía no levantó, reintentar
    }
    await sleep(150)
  }
  throw new Error(`CDP no respondió en el puerto ${port} tras ${timeoutMs}ms`)
}

async function getPageTargetWsUrl(port) {
  const deadline = Date.now() + 10000
  while (Date.now() < deadline) {
    const res = await fetch(`http://127.0.0.1:${port}/json/list`)
    const targets = await res.json()
    const page = targets.find((t) => t.type === 'page')
    if (page) return page.webSocketDebuggerUrl
    await sleep(150)
  }
  throw new Error('No apareció ningún target CDP de tipo "page"')
}

function cdpEvaluate(wsUrl, expression) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl)
    const id = 1
    const timeout = setTimeout(() => {
      ws.close()
      reject(new Error(`Timeout esperando respuesta de CDP para: ${expression}`))
    }, 8000)

    ws.addEventListener('open', () => {
      ws.send(
        JSON.stringify({
          id,
          method: 'Runtime.evaluate',
          params: { expression, awaitPromise: true, returnByValue: true }
        })
      )
    })
    ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data.toString())
      if (msg.id !== id) return
      clearTimeout(timeout)
      ws.close()
      if (msg.result?.exceptionDetails) {
        reject(new Error(JSON.stringify(msg.result.exceptionDetails, null, 2)))
      } else {
        resolve(msg.result?.result?.value)
      }
    })
    ws.addEventListener('error', (err) => {
      clearTimeout(timeout)
      reject(err instanceof Error ? err : new Error('Error de WebSocket con CDP'))
    })
  })
}

function launchApp() {
  const child = spawn(
    electronPath,
    [MAIN_ENTRY, `--user-data-dir=${SCRATCH_DIR}`, `--remote-debugging-port=${CDP_PORT}`],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  )
  let output = ''
  child.stdout.on('data', (d) => (output += d.toString()))
  child.stderr.on('data', (d) => (output += d.toString()))
  return { child, getOutput: () => output }
}

function killAndWait(child) {
  return new Promise((resolve) => {
    child.once('exit', () => resolve())
    child.kill('SIGTERM')
    // fallback por si el proceso no muere solo
    setTimeout(() => {
      try {
        child.kill('SIGKILL')
      } catch {
        // ya estaba muerto
      }
      resolve()
    }, 4000)
  })
}

const results = []
function check(label, pass, detail) {
  results.push({ label, pass })
  console.log(`${pass ? '✅' : '❌'} ${label}${detail ? ' — ' + detail : ''}`)
}

async function main() {
  requireBuilt()
  rmSync(SCRATCH_DIR, { recursive: true, force: true })
  mkdirSync(SCRATCH_DIR, { recursive: true })

  console.log(`Round 1: guardar config en una instancia nueva (userData de prueba: ${SCRATCH_DIR})`)
  const round1 = launchApp()
  try {
    await waitForCdp(CDP_PORT)
    const wsUrl = await getPageTargetWsUrl(CDP_PORT)

    const setResult = await cdpEvaluate(wsUrl, `window.api.setConfig(${JSON.stringify(EXPECTED)})`)
    check(
      'setConfig() devuelve la config recién guardada (round-trip de IPC ok)',
      JSON.stringify(pick(setResult, EXPECTED)) === JSON.stringify(EXPECTED),
      JSON.stringify(setResult)
    )
  } finally {
    await killAndWait(round1.child)
  }

  const configPath = join(SCRATCH_DIR, 'config.json')
  const onDisk = existsSync(configPath) ? JSON.parse(readFileSync(configPath, 'utf-8')) : null
  check(
    'config.json quedó escrito en disco con los valores esperados',
    onDisk !== null && JSON.stringify(pick(onDisk, EXPECTED)) === JSON.stringify(EXPECTED),
    onDisk ? JSON.stringify(onDisk) : 'archivo no encontrado'
  )

  console.log('\nRound 2: relanzar la app apuntando al mismo userData y leer la config')
  const round2 = launchApp()
  try {
    await waitForCdp(CDP_PORT)
    const wsUrl = await getPageTargetWsUrl(CDP_PORT)

    const getResult = await cdpEvaluate(wsUrl, 'window.api.getConfig()')
    check(
      'getConfig() en un proceso nuevo devuelve exactamente lo guardado antes de cerrar la app',
      JSON.stringify(pick(getResult, EXPECTED)) === JSON.stringify(EXPECTED),
      JSON.stringify(getResult)
    )
  } finally {
    await killAndWait(round2.child)
  }

  rmSync(SCRATCH_DIR, { recursive: true, force: true })

  const allPassed = results.every((r) => r.pass)
  console.log(allPassed ? '\nPersistencia end-to-end OK ✅' : '\nHay checks de persistencia que fallaron ❌')
  process.exit(allPassed ? 0 : 1)
}

function pick(obj, shape) {
  if (!obj || typeof obj !== 'object') return obj
  const out = {}
  for (const key of Object.keys(shape)) out[key] = obj[key]
  return out
}

main().catch((err) => {
  console.error('Error inesperado en el harness de persistencia:', err)
  rmSync(SCRATCH_DIR, { recursive: true, force: true })
  process.exit(1)
})
