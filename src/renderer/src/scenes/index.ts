import type { SceneId } from '../../../shared/config'
import type { DrawFn } from './SceneCanvas'
import { createRainScene } from './rain'
import { createFireplaceScene } from './fireplace'
import { createCafeScene } from './cafe'
import { createLibraryScene } from './library'

export interface SceneDef {
  id: SceneId
  label: string
  createDraw: () => DrawFn
}

export const SCENES: SceneDef[] = [
  { id: 'rain', label: 'Rain', createDraw: createRainScene },
  { id: 'fireplace', label: 'Fireplace', createDraw: createFireplaceScene },
  { id: 'cafe', label: 'Cafe', createDraw: createCafeScene },
  { id: 'library', label: 'Library', createDraw: createLibraryScene }
]

export function getScene(id: SceneId): SceneDef {
  return SCENES.find((s) => s.id === id) ?? SCENES[0]
}
