import type { DrawFn } from './SceneCanvas'

export function createFireplaceScene(): DrawFn {
  return (ctx, width, height, _dt, timeMs) => {
    ctx.fillStyle = '#100b12'
    ctx.fillRect(0, 0, width, height)

    ctx.fillStyle = '#4a2f1d'
    ctx.fillRect(width / 2 - 30, height - 20, 60, 10)

    const base = height - 22
    const layers = [
      { w: 26, h: 34, color: '#ff5b1f', speed: 120 },
      { w: 18, h: 26, color: '#ff9f1c', speed: 95 },
      { w: 10, h: 16, color: '#ffe066', speed: 70 }
    ]

    for (const layer of layers) {
      const jitter = Math.sin(timeMs / layer.speed) * 3 + (Math.random() - 0.5) * 2
      const w = layer.w + jitter
      const h = layer.h + jitter * 1.5
      ctx.fillStyle = layer.color
      ctx.beginPath()
      ctx.moveTo(width / 2, base - h)
      ctx.lineTo(width / 2 - w / 2, base)
      ctx.lineTo(width / 2 + w / 2, base)
      ctx.closePath()
      ctx.fill()
    }

    for (let i = 0; i < 6; i++) {
      const ex = width / 2 - 25 + i * 9
      const glow = Math.random() > 0.85 ? 1 : 0.25
      ctx.fillStyle = `rgba(255,120,40,${glow})`
      ctx.fillRect(ex, height - 18, 3, 2)
    }
  }
}
