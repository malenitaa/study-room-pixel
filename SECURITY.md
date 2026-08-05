# Security — mapping against the OWASP Top 10 (2021)

This app has no backend, no network, no accounts, and no third-party data — so most OWASP
Top 10 categories (originally meant for server-backed web apps) don't apply directly. Still,
this documents how each is mitigated, or why it doesn't apply, to keep it explicit and
auditable.

| # | OWASP Category | Applies here | Mitigation / reason |
|---|---|---|---|
| A01 | Broken Access Control | Partial | No users or roles. The only real "access boundary" is Node vs. renderer: `contextIsolation: true`, `nodeIntegration: false`, and `sandbox: true` on the `BrowserWindow` (`src/main/index.ts`) prevent the renderer from touching Node/`fs`/`child_process` directly. The preload (`src/preload/index.ts`) exposes only 4 specific functions via `contextBridge`, never raw objects. |
| A02 | Cryptographic Failures | N/A | No sensitive information, credentials, or personal data is handled. `config.json` only stores UI preferences (scene, volume, duration). |
| A03 | Injection | Mitigated | No SQL, shell, or `eval`/`new Function` anywhere in the code. The only "external" data read is `config.json` from disk, and it always goes through `sanitizeConfig()` (`src/shared/config.ts`), which validates types, ranges, and enums before trusting any field — even if the file was hand-edited or corrupted. |
| A04 | Insecure Design | Mitigated | "Zero network, zero accounts, zero telemetry" model by design: `connect-src 'none'` in the CSP makes any `fetch`/`XHR`/WebSocket attempt fail at runtime, not just "isn't done." Audio loads as bundled local assets (`media-src 'self'`), never streamed. |
| A05 | Security Misconfiguration | Mitigated | Strict CSP (`default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self'; connect-src 'none'; object-src 'none'`) declared as a meta tag in `index.html` — **that's the one that governs the packaged app**, since it loads via `file://` and `webRequest.onHeadersReceived` (also registered in `src/main/index.ts`) doesn't fire for that protocol (verified with `scripts/verify-security.mjs`). `npm run dev` intentionally uses a **relaxed** CSP (`script-src 'self' 'unsafe-eval' 'unsafe-inline'`, `connect-src` allowing the HMR websocket) — Vite/React Fast Refresh's bootstrap needs it to inject its script and apply hot updates; without it the window stays blank (a real bug that appeared and got fixed). That relaxation exists only in `src/main/index.ts` (the `isDev` branch) and `electron.vite.config.ts` (`devCspPlugin`, which only rewrites the meta tag when Vite runs as a dev server) — the production build never sees it. `will-navigate` and `setWindowOpenHandler` always deny, `will-attach-webview` is blocked, `setPermissionRequestHandler` denies every permission (mic, camera, notifications — the app needs none). No `remote` module. |
| A06 | Vulnerable and Outdated Components | Maintenance responsibility | Deliberately minimal dependencies (React + Electron + build tooling, no third-party audio/graphics libraries). Run `npm audit` and keep Electron updated periodically — Electron ships Chromium patches frequently. |
| A07 | Identification and Authentication Failures | N/A | No login or sessions. |
| A08 | Software and Data Integrity Failures | Mitigated | `electron-builder` packages all local code, with no auto-update configured (`publish: null`) — no remote channel that could be hijacked to serve a malicious update. If auto-update is ever added, it must be signed and verified. |
| A09 | Security Logging and Monitoring Failures | N/A | Local, single-user app, no telemetry or logs sent anywhere (on purpose — zero network). |
| A10 | Server-Side Request Forgery (SSRF) | N/A | No server, and the app makes no outgoing requests; `connect-src 'none'` guarantees that on the renderer side too. |

## Concrete points in the code

- `src/main/index.ts`: `webPreferences` with `contextIsolation`, `sandbox`, `nodeIntegration: false`; `app.enableSandbox()`; CSP via header (effective only in dev, see table above); `setPermissionRequestHandler` denies everything; `will-navigate`/`setWindowOpenHandler`/`will-attach-webview` block navigation and new windows.
- `src/preload/index.ts`: exposed surface = 4 functions (`getConfig`, `setConfig`, `setFullScreen`, `isFullScreen`), all tied to fixed IPC channels, never passing Electron/Node objects to the renderer.
- `src/shared/config.ts`: `sanitizeConfig()` — the JSON from `config.json` is never trusted as-is from disk.
- `src/renderer/index.html`: CSP as a meta tag — the one that actually protects the packaged app.

## Automated verification

`scripts/verify-security.mjs` launches the already-built app (`out/`) in a hidden window and
checks at runtime, against the real Electron process (not simulated): that
`window.require`/`window.process`/`require` aren't exposed, that `window.api` has exactly the
4 expected functions, that `will-navigate` blocks external navigation, that
`setWindowOpenHandler` denies `window.open`, and whether the CSP header got intercepted. Run
with:

```bash
npm run build
npx electron scripts/verify-security.mjs
```

Exits with code 0 if all checks pass, 1 if any fail (so it can be hooked into CI later if
needed).

If you find a real security issue in this personal project, feel free to open an issue or fix
it directly — there's no formal disclosure program since this isn't software distributed to
third parties.
