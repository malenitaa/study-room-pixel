import { useEffect, useRef } from 'react'

export const VIRTUAL_WIDTH = 192
export const VIRTUAL_HEIGHT = 108

export type DrawFn = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  dtMs: number,
  timeMs: number
) => void

interface SceneCanvasProps {
  draw: DrawFn
}

/**
 * Canvas de resolución virtual fija (192x108), redibujado con requestAnimationFrame y estirado
 * por CSS con image-rendering:pixelated — así se ve nítido en cualquier tamaño de ventana sin
 * necesitar sprites pre-renderizados en múltiples resoluciones.
 */
export function SceneCanvas({ draw }: SceneCanvasProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawRef = useRef(draw)
  drawRef.current = draw

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined
    ctx.imageSmoothingEnabled = false

    let raf = 0
    let last = performance.now()

    const loop = (now: number): void => {
      const dt = now - last
      last = now
      drawRef.current(ctx, VIRTUAL_WIDTH, VIRTUAL_HEIGHT, dt, now)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  return <canvas ref={canvasRef} className="pixel-canvas" width={VIRTUAL_WIDTH} height={VIRTUAL_HEIGHT} />
}
