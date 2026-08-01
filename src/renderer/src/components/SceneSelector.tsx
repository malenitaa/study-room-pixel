import { useMemo } from 'react'
import { SceneCanvas } from '../scenes/SceneCanvas'
import { SCENES, type SceneDef } from '../scenes'
import type { SceneId } from '../../../shared/config'

interface SceneThumbProps {
  scene: SceneDef
  active: boolean
  onSelect: () => void
}

function SceneThumb({ scene, active, onSelect }: SceneThumbProps): JSX.Element {
  const draw = useMemo(() => scene.createDraw(), [scene])

  return (
    <button className={`scene-option ${active ? 'active' : ''}`} onClick={onSelect}>
      <span className="scene-thumb">
        <SceneCanvas draw={draw} />
      </span>
      <span>{scene.label}</span>
    </button>
  )
}

interface SceneSelectorProps {
  current: SceneId
  onSelect: (scene: SceneId) => void
}

export function SceneSelector({ current, onSelect }: SceneSelectorProps): JSX.Element {
  return (
    <div className="scene-selector">
      {SCENES.map((scene) => (
        <SceneThumb key={scene.id} scene={scene} active={scene.id === current} onSelect={() => onSelect(scene.id)} />
      ))}
    </div>
  )
}
