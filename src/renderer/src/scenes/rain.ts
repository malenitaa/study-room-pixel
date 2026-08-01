import type { DrawFn } from './SceneCanvas'

interface Drop {
  x: number
  y: number
  len: number
  speed: number
}

function randomDrop(width: number, height: number): Drop {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    len: 3 + Math.random() * 4,
    speed: 60 + Math.random() * 60
  }
}

export function createRainScene(): DrawFn {
  const drops: Drop[] = Array.from({ length: 46 }, () => randomDrop(192, 108))

  return (ctx, width, height, dt) => {
    ctx.fillStyle = '#141024'
    ctx.fillRect(0, 0, width, height)

    ctx.strokeStyle = '#3a2c55'
    ctx.lineWidth = 2
    ctx.strokeRect(4, 4, width - 8, height - 8)
    ctx.beginPath()
    ctx.moveTo(width / 2, 4)
    ctx.lineTo(width / 2, height - 4)
    ctx.moveTo(4, height / 2)
    ctx.lineTo(width - 4, height / 2)
    ctx.stroke()

    ctx.strokeStyle = 'rgba(180,190,255,0.55)'
    ctx.lineWidth = 1
    for (const drop of drops) {
      drop.y += (drop.speed * dt) / 1000
      if (drop.y > height) {
        const fresh = randomDrop(width, height)
        drop.x = fresh.x
        drop.len = fresh.len
        drop.speed = fresh.speed
        drop.y = -drop.len
      }
      ctx.beginPath()
      ctx.moveTo(drop.x, drop.y)
      ctx.lineTo(drop.x, drop.y + drop.len)
      ctx.stroke()
    }
  }
}
