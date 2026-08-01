import type { DrawFn } from './SceneCanvas'

const TOTAL_BURN_MS = 20 * 60 * 1000 // referencia visual (la vela se consume sola con el tiempo de sesión)

export function createLibraryScene(): DrawFn {
  let elapsed = 0

  return (ctx, width, height, dt, timeMs) => {
    ctx.fillStyle = '#1c1730'
    ctx.fillRect(0, 0, width, height)

    ctx.fillStyle = '#2c2444'
    for (let row = 0; row < 3; row++) {
      ctx.fillRect(10, 14 + row * 20, width - 20, 4)
    }

    elapsed += dt
    const burnRatio = 0.25 + 0.75 * (1 - Math.min(1, elapsed / TOTAL_BURN_MS))
    const candleX = width / 2
    const baseY = height - 16
    const candleHeight = 26 * burnRatio

    ctx.fillStyle = '#e8dcc0'
    ctx.fillRect(candleX - 4, baseY - candleHeight, 8, candleHeight)

    const flicker = Math.sin(timeMs / 90) * 1.2 + Math.random() * 0.8
    ctx.fillStyle = '#ffdd66'
    ctx.beginPath()
    ctx.ellipse(candleX, baseY - candleHeight - 4 - flicker, 3, 6 + flicker, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = 'rgba(255,220,140,0.06)'
    ctx.beginPath()
    ctx.arc(candleX, baseY - candleHeight, 40, 0, Math.PI * 2)
    ctx.fill()
  }
}
