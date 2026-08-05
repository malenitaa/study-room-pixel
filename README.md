# Study Room Pixel

Desktop app (Electron + React + Vite) that shows an ambient pixel-art scene —rain,
fireplace, café, or library— with looping audio and a built-in study/focus timer. Meant
to run in the background while you work.

Zero network, zero accounts, zero telemetry: all audio and scenes are local, no network
call is even possible (see [SECURITY.md](./SECURITY.md) for the point-by-point detail
against the OWASP Top 10).

If you're going to *use* the app (not touch the code), check out [INSTALAR.md](./INSTALAR.md)
instead of this file.

## Stack

- [Electron](https://www.electronjs.org/) + [React](https://react.dev/) + [Vite](https://vitejs.dev/) via [`electron-vite`](https://electron-vite.org/)
- TypeScript across all three layers (main / preload / renderer)
- No database: a single `config.json` in `app.getPath('userData')`
- No third-party audio/graphics libraries: scenes are hand-drawn `<canvas>` frame by
  frame, and audio is two `<audio>` elements (looping ambience + notification chime)
- `electron-builder` for packaging (target `mac`: dmg + zip)

## Requirements

- Node.js 20+ and npm
- macOS (`electron-builder.yml` is configured for the `mac` target; the rest of the code
  doesn't use anything platform-specific, so adding `win`/`linux` to `electron-builder.yml`
  would be enough if you ever want to package for another OS)

## Scripts

```bash
npm install                # install dependencies
npm run generate-audio     # (re)generates the .wav files in resources/audio/ — see the audio section below
npm run dev                # electron-vite dev, with HMR in the renderer
npm run typecheck          # tsc --noEmit over main/preload and renderer (also run by "build")
npm run build               # production build (main + preload + renderer) into out/
npm run verify:security      # build + runs scripts/verify-security.mjs (see SECURITY.md)
npm run verify:persistence    # build + runs scripts/verify-persistence.mjs (see below)
npm run dist                   # build + packages with electron-builder (dmg/zip in dist/)
```

`resources/audio/*.wav` are already generated and committed — no need to run
`generate-audio` to develop, only if you want to regenerate them or tweak the synthesis.

### About `npm run dist` (code signing)

The build is **not signed or notarized** (`identity: null` in `electron-builder.yml`,
on purpose — there's no Apple developer account for this personal project). This is
intentional, not a pending bug: [INSTALAR.md](./INSTALAR.md) already explains how to
open the app anyway by getting past the Gatekeeper warning the first time.

Note if you build from a folder synced by iCloud Drive (like this repo's default path,
inside `~/Library/Mobile Documents/com~apple~CloudDocs/...`): if you ever DO want to
sign with a real identity, `codesign` fails there with *"resource fork, Finder
information, or similar detritus not allowed"* — those are extended attributes iCloud
adds to files. To actually sign it, move the repo (or at least the build folder) out of
iCloud Drive first.

## Project structure

```
src/
  shared/config.ts        Shared config type + sanitizeConfig() (main and renderer)
  main/
    index.ts               BrowserWindow, CSP, navigation blocking, IPC handlers
    config.ts               Reads/writes config.json in userData
  preload/
    index.ts                 contextBridge: the only surface exposed to the renderer
    index.d.ts                 Typing for window.api
  renderer/
    index.html                 CSP also as a meta tag (defense in depth)
    src/
      App.tsx                   Composes scene + HUD (selector, timer, volume, toggles)
      scenes/                     Each scene is a `draw(ctx, w, h, dt, t)` function over a
                                    fixed virtual-resolution canvas (192x108), CSS-scaled
                                    with image-rendering:pixelated — crisp at any window
                                    size without needing pre-rendered sprites
      components/                 Timer, SceneSelector (thumbnails), VolumeControls, TitleBarControls
      timer/useTimer.ts             Timestamp-based timer (see Timer section below)
      audio/                         AudioManager (two <audio> elements) + useAmbientAudio hook
      config/useConfig.ts             Hook: optimistic state + debounced persistence via IPC
      styles/global.css                 Purple/lavender/pink palette, scene transition via steps()
resources/audio/            The 5 placeholder .wav files (see below)
scripts/generate-audio.mjs   Script that synthesizes those .wav files (no network, no third-party assets)
```

## Timer that survives the machine sleeping

`useTimer` doesn't use a counter decremented via `setInterval` (that drifts out of sync
if the laptop sleeps). Instead it stores `endAt = Date.now() + duration`, and on each
tick recomputes `remaining = endAt - Date.now()`. The 250ms `setInterval` only triggers
that recalculation — it never accumulates time. If the machine sleeps for 2 hours, on
waking the next tick computes the real remaining time (or that it already finished),
rather than continuing as if nothing happened.

## Persistence verification (config across restarts)

`scripts/verify-persistence.mjs` tests that `config.json` survives closing and reopening
the app, against the real pipeline (not a reimplementation of the save logic):

1. Launches the already-built app (`out/main/index.js`) as a real child process, with a
   test `--user-data-dir` (isolated from your real config) and
   `--remote-debugging-port` so it can be driven via the Chrome DevTools Protocol.
2. Asks it, via CDP, to call `window.api.setConfig({...})` with test values — exactly
   the same call the real UI makes.
3. Closes that process, reads `config.json` from disk to confirm it was written.
4. Launches a **new** instance, pointing at the same `--user-data-dir`, and asks it for
   `window.api.getConfig()` — confirms it returns exactly what was saved before closing.

```bash
npm run verify:persistence
```

Needs no new dependency: it uses Node 22+'s global `fetch`/`WebSocket` to speak CDP.
`--remote-debugging-port` is only used here, when manually invoking the process for
testing — the packaged app an end user installs is never launched with that flag.

## Audio: what each file is and how to replace it

The five `.wav` files in `resources/audio/` **are code-synthesized placeholders**
(`scripts/generate-audio.mjs`), not real recordings — no third-party audio asset was
downloaded or used (avoids license issues and respects that the app can't reach out to
any external source).

| File | Use | How it's synthesized | Source / License |
|---|---|---|---|
| `rain.wav` | Ambient loop, Rain scene | Low-pass filtered noise + occasional higher-pitched drops | Generated by `scripts/generate-audio.mjs` — no external source, no third-party license |
| `fireplace.wav` | Ambient loop, Fireplace scene | Constant low rumble + random decaying crackles | Generated by `scripts/generate-audio.mjs` — no external source, no third-party license |
| `cafe.wav` | Ambient loop, Café scene | Low murmur (indistinguishable voices) + occasional clinks | Generated by `scripts/generate-audio.mjs` — no external source, no third-party license |
| `library.wav` | Ambient loop, Library scene | Very faint room tone + occasional page turn | Generated by `scripts/generate-audio.mjs` — no external source, no third-party license |
| `chime.wav` | Notification sound when the timer ends | 3-tone chord with an exponential envelope | Generated by `scripts/generate-audio.mjs` — no external source, no third-party license |

No audio file was downloaded or comes from a third-party sound library — all five are
pure mathematical synthesis (filtered noise, oscillators, envelopes), generated locally
by the script. This is deliberate: it avoids any license question and respects that the
app can't reach out to any external source for assets.

### Scene switching: crossfade, not an abrupt cut

`AudioManager` keeps two fixed `<audio>` elements for ambience (created once, in the
constructor — no new `Audio` instances get created when switching scenes). When you pick
another scene, the incoming track starts at volume 0 and the outgoing one starts at its
current volume; both cross over via `requestAnimationFrame` across ~450ms until the
outgoing one reaches 0 and pauses. There are never two loops playing at full volume at
the same time, nor an abrupt cut to silence.

**To replace them with real audio** (your own recordings, or licensed assets you've
bought/downloaded yourself): just overwrite the matching file in `resources/audio/`
keeping the same name — no code changes needed. Recommendations:
- Mono, 16-bit PCM, any reasonable sample rate (22050–44100 Hz)
- The looping ones (everything but `chime.wav`) should start and end at a similar
  phase/level so the loop point isn't noticeable — the simplest way is a short crossfade
  at the edges
- Fixed filenames: `rain.wav`, `fireplace.wav`, `cafe.wav`, `library.wav`, `chime.wav`

## Security

See [SECURITY.md](./SECURITY.md) for the full detail (CSP, sandboxing, mapping against
the OWASP Top 10). Summary: `contextIsolation` + `sandbox` + `nodeIntegration: false`,
minimal-surface preload, strict CSP applied both by header and meta tag, navigation/new
windows/webviews blocked, no `eval`, no network dependencies.

## License

MIT — see [LICENSE](./LICENSE).
