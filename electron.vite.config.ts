import { resolve } from 'node:path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'

// La CSP de producción (script-src 'self', sin eval/inline) rompe el bootstrap de Vite/React
// Fast Refresh en dev (usa un script inline + eval para aplicar hot updates). Este plugin
// reescribe la meta tag SOLO cuando Vite corre como dev server (ctx.server presente); el build
// de producción no lo toca y sale con la CSP estricta tal cual está en index.html.
// La contraparte del lado del main process (header CSP) vive en src/main/index.ts — deben
// mantenerse en sync si se toca una de las dos.
const DEV_CSP =
  "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; " +
  "style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self'; " +
  "connect-src 'self' ws://localhost:5173; object-src 'none'"

function devCspPlugin(): Plugin {
  return {
    name: 'dev-only-relaxed-csp',
    transformIndexHtml(html, ctx) {
      if (!ctx.server) return html // build de producción: no tocar
      return html.replace(/content="default-src[^"]*"/, `content="${DEV_CSP}"`)
    }
  }
}

export default defineConfig({
  // main y preload externalizan las dependencias por defecto (build.externalizeDeps, electron-vite 5+).
  main: {},
  preload: {},
  renderer: {
    root: 'src/renderer',
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    assetsInclude: ['**/*.wav'],
    server: {
      fs: {
        allow: [resolve('.')]
      }
    },
    plugins: [react(), devCspPlugin()]
  }
})
