# Study Room Pixel

App de escritorio (Electron + React + Vite) que muestra una escena pixel art ambiental —lluvia,
chimenea, cafetería o biblioteca— con audio de loop y un timer de estudio/foco integrado. Pensada
para dejar corriendo de fondo mientras trabajás.

Cero red, cero cuentas, cero telemetría: todo el audio y las escenas son locales, no hay ninguna
llamada de red posible (ver [SECURITY.md](./SECURITY.md) para el detalle punto por punto contra
OWASP Top 10).

Si sos quien va a *usar* la app (no a tocar el código), mirá [INSTALAR.md](./INSTALAR.md) en vez de
este archivo.

## Stack

- [Electron](https://www.electronjs.org/) + [React](https://react.dev/) + [Vite](https://vitejs.dev/) vía [`electron-vite`](https://electron-vite.org/)
- TypeScript en las tres capas (main / preload / renderer)
- Sin base de datos: un único `config.json` en `app.getPath('userData')`
- Sin librerías de audio/gráficos de terceros: las escenas son `<canvas>` dibujado a mano cuadro a
  cuadro, y el audio son dos `<audio>` (ambiente en loop + chime de notificación)
- `electron-builder` para empaquetar (target `mac`: dmg + zip)

## Requisitos

- Node.js 20+ y npm
- macOS (el `electron-builder.yml` está configurado para target `mac`; el resto del código no
  usa nada específico de plataforma, así que agregar `win`/`linux` a `electron-builder.yml` alcanzaría
  si en algún momento se quiere empaquetar para otro sistema)

## Scripts

```bash
npm install                # instala dependencias
npm run generate-audio     # (re)genera los .wav de resources/audio/ — ver sección de audio abajo
npm run dev                # electron-vite dev, con HMR en el renderer
npm run typecheck          # tsc --noEmit sobre main/preload y renderer (lo corre "build" también)
npm run build               # build de producción (main + preload + renderer) en out/
npm run verify:security      # build + corre scripts/verify-security.mjs (ver SECURITY.md)
npm run dist                  # build + empaqueta con electron-builder (dmg/zip en dist/)
```

`resources/audio/*.wav` ya vienen generados y commiteados — no hace falta correr
`generate-audio` para desarrollar, solo si querés regenerarlos o tocar la síntesis.

### Sobre `npm run dist` (firma de código)

El build **no está firmado ni notarizado** (`identity: null` en `electron-builder.yml`, a propósito
— no hay cuenta de desarrollador Apple para este proyecto personal). Esto es intencional, no un
error pendiente: [INSTALAR.md](./INSTALAR.md) ya explica cómo abrir la app igual sorteando el
aviso de Gatekeeper la primera vez.

Nota si compilás desde una carpeta sincronizada por iCloud Drive (como el path por default de este
repo, dentro de `~/Library/Mobile Documents/com~apple~CloudDocs/...`): si en algún momento SÍ
querés firmar con una identidad real, `codesign` falla ahí con *"resource fork, Finder information,
or similar detritus not allowed"* — son atributos extendidos que iCloud le agrega a los archivos.
Para firmar de verdad, movés el repo (o al menos la carpeta de build) fuera de iCloud Drive primero.

## Estructura del proyecto

```
src/
  shared/config.ts        Tipo de configuración compartido + sanitizeConfig() (main y renderer)
  main/
    index.ts               BrowserWindow, CSP, bloqueo de navegación, handlers IPC
    config.ts               Lectura/escritura de config.json en userData
  preload/
    index.ts                 contextBridge: única superficie expuesta al renderer
    index.d.ts                 Tipado de window.api
  renderer/
    index.html                 CSP también como meta tag (defensa en profundidad)
    src/
      App.tsx                   Compone escena + HUD (selector, timer, volumen, toggles)
      scenes/                     Cada escena es una función `draw(ctx, w, h, dt, t)` sobre un
                                    canvas de resolución virtual fija (192x108), escalado por CSS
                                    con image-rendering:pixelated — nítido en cualquier tamaño de
                                    ventana sin necesitar sprites pre-renderizados
      components/                 Timer, SceneSelector (thumbnails), VolumeControls, TitleBarControls
      timer/useTimer.ts             Timer basado en timestamps (ver sección Timer abajo)
      audio/                         AudioManager (dos <audio>) + hook useAmbientAudio
      config/useConfig.ts             Hook: estado optimista + persistencia debounced vía IPC
      styles/global.css                 Paleta violeta/lavanda/rosa, transición de escena en steps()
resources/audio/            Los 5 .wav placeholder (ver más abajo)
scripts/generate-audio.mjs   Script que sintetiza esos .wav (sin red, sin assets de terceros)
```

## Timer a prueba de que la máquina se duerma

`useTimer` no usa un contador que se decrementa con `setInterval` (eso se desincroniza si la
laptop se suspende). En cambio guarda `endAt = Date.now() + duración`, y en cada tick recalcula
`remaining = endAt - Date.now()`. El `setInterval` de 250ms solo dispara ese recálculo — nunca
acumula tiempo. Si la máquina duerme 2 horas, al despertar el próximo tick calcula el remaining
real (o que ya terminó), no sigue como si nada hubiera pasado.

## Audio: qué es cada archivo y cómo reemplazarlo

Los cinco `.wav` en `resources/audio/` **son placeholders sintetizados por código**
(`scripts/generate-audio.mjs`), no grabaciones reales — no se descargó ni se usó ningún asset de
audio de terceros (evita problemas de licencias y respeta que la app no puede pegarle a ninguna
fuente externa).

| Archivo | Uso | Cómo está sintetizado | Fuente / Licencia |
|---|---|---|---|
| `rain.wav` | Loop ambiente, escena Lluvia | Ruido filtrado pasa-bajos + gotas ocasionales más agudas | Generado por `scripts/generate-audio.mjs` — sin fuente externa, sin licencia de terceros |
| `fireplace.wav` | Loop ambiente, escena Chimenea | Rumor grave constante + crackles aleatorios con decaimiento | Generado por `scripts/generate-audio.mjs` — sin fuente externa, sin licencia de terceros |
| `cafe.wav` | Loop ambiente, escena Cafetería | Murmullo grave (voces indistinguibles) + tintineos ocasionales | Generado por `scripts/generate-audio.mjs` — sin fuente externa, sin licencia de terceros |
| `library.wav` | Loop ambiente, escena Biblioteca | Room tone muy tenue + pase de página ocasional | Generado por `scripts/generate-audio.mjs` — sin fuente externa, sin licencia de terceros |
| `chime.wav` | Sonido de notificación al terminar el timer | Acorde de 3 tonos con envolvente exponencial | Generado por `scripts/generate-audio.mjs` — sin fuente externa, sin licencia de terceros |

Ningún archivo de audio fue descargado ni proviene de un banco de sonidos de terceros — los cinco
son síntesis matemática pura (ruido filtrado, osciladores, envolventes), generados localmente por
el script. Esto es deliberado: evita cualquier duda de licencia y respeta que la app no puede
pegarle a ninguna fuente externa para conseguir assets.

### Cambio de escena: crossfade, no corte abrupto

`AudioManager` mantiene dos elementos `<audio>` fijos para el ambiente (creados una única vez, en
el constructor — nunca se instancian `Audio` nuevos al cambiar de escena). Al elegir otra escena,
el track entrante arranca en volumen 0 y el saliente empieza en su volumen actual; ambos se cruzan
con `requestAnimationFrame` a lo largo de ~450ms hasta que el saliente llega a 0 y se pausa. Nunca
hay dos loops sonando a volumen completo al mismo tiempo, ni un corte seco a silencio.

**Para reemplazarlos por audio real** (grabaciones propias, o assets con licencia que hayas
comprado/descargado vos): simplemente pisá el archivo correspondiente en `resources/audio/`
manteniendo el mismo nombre — no hace falta tocar código. Recomendaciones:
- Mono, 16-bit PCM, cualquier sample rate razonable (22050–44100 Hz)
- Los de loop (todos menos `chime.wav`) deben empezar y terminar en fase/nivel similar para que no
  se note el corte al repetirse — lo más simple es aplicarles un crossfade corto en los bordes
- Nombres de archivo fijos: `rain.wav`, `fireplace.wav`, `cafe.wav`, `library.wav`, `chime.wav`

## Seguridad

Ver [SECURITY.md](./SECURITY.md) para el detalle completo (CSP, sandboxing, mapeo contra OWASP
Top 10). Resumen: `contextIsolation` + `sandbox` + `nodeIntegration: false`, preload con superficie
mínima, CSP estricta aplicada por header y por meta tag, navegación/ventanas nuevas/webviews
bloqueados, sin `eval`, sin dependencias de red.

## Licencia

MIT — ver [LICENSE](./LICENSE).
