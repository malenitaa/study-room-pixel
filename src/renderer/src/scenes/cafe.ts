import type { DrawFn } from './SceneCanvas'

interface Passerby {
  x: number
  speed: number
  height: number
}

interface SteamParticle {
  x: number
  y: number
  life: number
}

export function createCafeScene(): DrawFn {
  const people: Passerby[] = Array.from({ length: 4 }, (_, i) => ({
    x: (i * 192) / 4,
    speed: 8 + Math.random() * 6,
    height: 20 + Math.random() * 6
  }))
  const steam: SteamParticle[] = Array.from({ length: 10 }, () => ({ x: 0, y: 0, life: Math.random() }))

  return (ctx, width, height, dt) => {
    ctx.fillStyle = '#241a1a'
    ctx.fillRect(0, 0, width, height)
    ctx.fillStyle = '#3a2a24'
    ctx.fillRect(0, height - 30, width, 30)

    ctx.fillStyle = 'rgba(20,14,14,0.85)'
    for (const p of people) {
      p.x += (p.speed * dt) / 1000
      if (p.x > width + 10) p.x = -10
      ctx.fillRect(p.x, height - 30 - p.height, 6, p.height)
    }

    const cupX = width - 30
    const cupY = height - 34
    ctx.fillStyle = '#d8c9b8'
    ctx.fillRect(cupX, cupY, 12, 8)

    ctx.strokeStyle = 'rgba(255,255,255,0.4)'
    for (const s of steam) {
      s.life -= dt / 1500
      if (s.life <= 0) {
        s.life = 1
        s.x = cupX + 6 + (Math.random() - 0.5) * 4
        s.y = cupY
      }
      const t = 1 - s.life
      ctx.globalAlpha = s.life
      ctx.beginPath()
      ctx.moveTo(s.x, s.y - t * 20)
      ctx.lineTo(s.x + Math.sin(t * 6) * 3, s.y - t * 20 - 3)
      ctx.stroke()
      ctx.globalAlpha = 1
    }
  }
}
