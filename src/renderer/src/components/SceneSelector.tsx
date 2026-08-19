import { useMemo } from 'react'
import { SceneCanvas } from '../scenes/SceneCanvas'
import { SCENES, type SceneDef } from '../scenes'
import { SCENE_LABEL_KEY, type Strings } from '../i18n/strings'
import type { SceneId } from '../../../shared/config'

interface SceneThumbProps {
  scene: SceneDef
  label: string
  active: boolean
  onSelect: () => void
}

function SceneThumb({ scene, label, active, onSelect }: SceneThumbProps): JSX.Element {
  const draw = useMemo(() => scene.createDraw(), [scene])

  return (
    <button className={`scene-option ${active ? 'active' : ''}`} onClick={onSelect}>
      <span className="scene-thumb">
        <SceneCanvas draw={draw} />
      </span>
      <span>{label}</span>
    </button>
  )
}

interface SceneSelectorProps {
  t: Strings
  current: SceneId
  onSelect: (scene: SceneId) => void
}

export function SceneSelector({ t, current, onSelect }: SceneSelectorProps): JSX.Element {
  return (
    <div className="scene-selector">
      {SCENES.map((scene) => (
        <SceneThumb
          key={scene.id}
          scene={scene}
          label={t[SCENE_LABEL_KEY[scene.id]]}
          active={scene.id === current}
          onSelect={() => onSelect(scene.id)}
        />
      ))}
    </div>
  )
}
