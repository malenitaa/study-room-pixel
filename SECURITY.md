# Seguridad — mapeo contra OWASP Top 10 (2021)

Esta app no tiene backend, no tiene red, no tiene cuentas ni datos de terceros — así que la
mayoría de las categorías del OWASP Top 10 (pensado originalmente para apps web con servidor)
no aplican directamente. Igual documento acá cómo se mitiga cada una, o por qué no aplica, para
que quede explícito y auditable.

| # | Categoría OWASP | Aplica acá | Mitigación / motivo |
|---|---|---|---|
| A01 | Broken Access Control | Parcial | No hay usuarios ni roles. El único "límite de acceso" real es Node vs. renderer: `contextIsolation: true`, `nodeIntegration: false` y `sandbox: true` en el `BrowserWindow` (`src/main/index.ts`) impiden que el renderer toque Node/`fs`/`child_process` directamente. El preload (`src/preload/index.ts`) expone únicamente 4 funciones puntuales vía `contextBridge`, nunca objetos crudos. |
| A02 | Cryptographic Failures | No aplica | No se maneja información sensible, credenciales ni datos personales. `config.json` solo guarda preferencias de UI (escena, volumen, duración). |
| A03 | Injection | Mitigado | No hay SQL, shell ni `eval`/`new Function` en ningún lado del código. El único dato "externo" que se lee es `config.json` desde disco, y se pasa siempre por `sanitizeConfig()` (`src/shared/config.ts`), que valida tipos, rangos y enums antes de confiar en cualquier campo — incluso si el archivo fue editado a mano o está corrupto. |
| A04 | Insecure Design | Mitigado | Modelo "cero red, cero cuentas, cero telemetría" desde el diseño: `connect-src 'none'` en la CSP hace que cualquier intento de `fetch`/`XHR`/WebSocket falle en runtime, no solo "no se hace". Los audios se cargan como assets locales bundleados (`media-src 'self'`), nunca por streaming. |
| A05 | Security Misconfiguration | Mitigado | CSP estricta (`default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self'; connect-src 'none'; object-src 'none'`) declarada como meta tag en `index.html` — **esa es la que rige en la app empaquetada**, porque carga vía `file://` y `webRequest.onHeadersReceived` (también registrado en `src/main/index.ts`) no se dispara para ese protocolo (verificado con `scripts/verify-security.mjs`). En `npm run dev` se usa a propósito una CSP **relajada** (`script-src 'self' 'unsafe-eval' 'unsafe-inline'`, `connect-src` permitiendo el websocket de HMR) — el bootstrap de Vite/React Fast Refresh la necesita para inyectar su script y aplicar hot updates; sin eso la ventana queda en blanco (bug real que apareció y se corrigió). Esa relajación existe únicamente en `src/main/index.ts` (rama `isDev`) y en `electron.vite.config.ts` (`devCspPlugin`, que solo reescribe la meta tag cuando Vite corre como dev server) — el build de producción nunca la ve. `will-navigate` y `setWindowOpenHandler` deniegan siempre, `will-attach-webview` bloqueado, `setPermissionRequestHandler` deniega todo permiso (mic, cámara, notificaciones — la app no necesita ninguno). Sin `remote` module. |
| A06 | Vulnerable and Outdated Components | Responsabilidad del mantenimiento | Dependencias mínimas a propósito (React + Electron + tooling de build, sin librerías de audio/gráficos de terceros). Correr `npm audit` y mantener Electron actualizado periódicamente — Electron ships parches de Chromium con frecuencia. |
| A07 | Identification and Authentication Failures | No aplica | No hay login ni sesiones. |
| A08 | Software and Data Integrity Failures | Mitigado | `electron-builder` empaqueta todo el código local, sin auto-update configurado (`publish: null`) — no hay canal remoto que pueda ser secuestrado para servir un update malicioso. Si en el futuro se agrega auto-update, hay que firmarlo y verificarlo. |
| A09 | Security Logging and Monitoring Failures | No aplica | App local de un solo usuario, sin telemetría ni logs enviados a ningún lado (a propósito — cero red). |
| A10 | Server-Side Request Forgery (SSRF) | No aplica | No hay servidor ni la app hace requests salientes; `connect-src 'none'` lo garantiza también del lado del renderer. |

## Puntos concretos del código

- `src/main/index.ts`: `webPreferences` con `contextIsolation`, `sandbox`, `nodeIntegration: false`; `app.enableSandbox()`; CSP por header (efectiva solo en dev, ver tabla arriba); `setPermissionRequestHandler` deniega todo; `will-navigate`/`setWindowOpenHandler`/`will-attach-webview` bloquean navegación y ventanas nuevas.
- `src/preload/index.ts`: superficie expuesta = 4 funciones (`getConfig`, `setConfig`, `setFullScreen`, `isFullScreen`), todas atadas a canales IPC fijos, sin pasar objetos de Electron/Node al renderer.
- `src/shared/config.ts`: `sanitizeConfig()` — nunca se confía en el JSON de `config.json` tal cual viene de disco.
- `src/renderer/index.html`: CSP como meta tag — la que efectivamente protege la app empaquetada.

## Verificación automatizada

`scripts/verify-security.mjs` levanta la app ya buildeada (`out/`) en una ventana oculta y chequea
en runtime, contra el proceso real de Electron (no simulado): que `window.require`/`window.process`/
`require` no están expuestos, que `window.api` tiene exactamente las 4 funciones esperadas, que
`will-navigate` bloquea navegación externa, que `setWindowOpenHandler` deniega `window.open`, y si
el header CSP llegó a interceptarse. Correr con:

```bash
npm run build
npx electron scripts/verify-security.mjs
```

Sale con código 0 si todos los checks pasan, 1 si alguno falla (para poder engancharlo a CI en el
futuro si hiciera falta).

Si encontrás un problema de seguridad real en este proyecto personal, alcanza con abrir un issue o corregirlo directamente — no hay un programa formal de disclosure porque no es software distribuido a terceros.
