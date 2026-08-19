import type { SceneId } from '../../../shared/config'
import type { DrawFn } from './SceneCanvas'
import { createRainScene } from './rain'
import { createFireplaceScene } from './fireplace'
import { createCafeScene } from './cafe'
import { createLibraryScene } from './library'

// Scene display names live in src/renderer/src/i18n/strings.ts (SCENE_LABEL_KEY).
export interface SceneDef {
  id: SceneId
  createDraw: () => DrawFn
}

export const SCENES: SceneDef[] = [
  { id: 'rain', createDraw: createRainScene },
  { id: 'fireplace', createDraw: createFireplaceScene },
  { id: 'cafe', createDraw: createCafeScene },
  { id: 'library', createDraw: createLibraryScene }
]

export function getScene(id: SceneId): SceneDef {
  return SCENES.find((s) => s.id === id) ?? SCENES[0]
}
