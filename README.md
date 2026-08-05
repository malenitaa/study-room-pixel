# Study Room Pixel

[![Download latest release](https://img.shields.io/github/v/release/malenitaa/study-room-pixel?label=download&color=6b46c1)](https://github.com/malenitaa/study-room-pixel/releases/latest)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![macOS](https://img.shields.io/badge/platform-macOS-lightgrey)](#)

A free macOS desktop app that shows an ambient pixel-art scene — **rain, fireplace, café, or
library** — with looping audio and a built-in study/focus timer. Meant to run quietly in the
background while you work.

Zero network, zero accounts, zero telemetry — everything is local. See [SECURITY.md](./SECURITY.md)
for the full OWASP Top 10 mapping.

## Installation

See [`INSTALL.md`](./INSTALL.md) for a simple, no-terminal, step-by-step guide (including
how to get past the macOS Gatekeeper warning for an unsigned app).

Short version: download the `.dmg` from [Releases](https://github.com/malenitaa/study-room-pixel/releases),
drag it into Applications, right-click → Open the first time.

## Features

- Four ambient scenes (rain, fireplace, café, library), switch instantly.
- Independent ambient/notification volume controls.
- A focus timer with preset durations or custom minutes.
- "Always on top" pin so it stays visible while you work in another app.
- Fullscreen mode.

## For developers

Requirements: Node.js 20+, macOS.

```bash
git clone https://github.com/malenitaa/study-room-pixel.git
cd study-room-pixel
npm install
npm run dev
```

## Enjoyed it?

If this was useful and you'd like to support the project:

- [Cafecito](https://cafecito.app/rezamalena)
- [Ko-fi](https://ko-fi.com/malenitaa)

## License

MIT — see [LICENSE](./LICENSE).
