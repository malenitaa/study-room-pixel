import { useEffect, useMemo, useRef, useState } from 'react'
import { SceneCanvas } from '../scenes/SceneCanvas'
import { getScene } from '../scenes'
import type { SceneId } from '../../../shared/config'

interface SceneViewProps {
  sceneId: SceneId
}

const FADE_MS = 260

export function SceneView({ sceneId }: SceneViewProps): JSX.Element {
  const sceneDef = getScene(sceneId)
  const draw = useMemo(() => sceneDef.createDraw(), [sceneDef])
  const [fading, setFading] = useState(false)
  const prevSceneId = useRef(sceneId)

  useEffect(() => {
    if (prevSceneId.current === sceneId) return undefined
    prevSceneId.current = sceneId
    setFading(true)
    const timeout = window.setTimeout(() => setFading(false), FADE_MS)
    return () => window.clearTimeout(timeout)
  }, [sceneId])

  return (
    <div className="scene-view">
      <SceneCanvas draw={draw} />
      <div className={`scene-fade-overlay ${fading ? 'active' : ''}`} />
    </div>
  )
}
