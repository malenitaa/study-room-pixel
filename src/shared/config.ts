export type SceneId = 'rain' | 'fireplace' | 'cafe' | 'library'

export interface AppConfig {
  scene: SceneId
  ambientVolume: number
  notifVolume: number
  lastDurationMs: number
  alwaysOnTop: boolean
}

export const DEFAULT_CONFIG: AppConfig = {
  scene: 'rain',
  ambientVolume: 0.6,
  notifVolume: 0.7,
  lastDurationMs: 25 * 60 * 1000,
  alwaysOnTop: false
}

const SCENE_IDS: SceneId[] = ['rain', 'fireplace', 'cafe', 'library']

function clamp01(value: unknown, fallback: number): number {
  const num = typeof value === 'number' && Number.isFinite(value) ? value : fallback
  return Math.min(1, Math.max(0, num))
}

/** Merges arbitrary (possibly corrupt/hand-edited) JSON with defaults, never trusting the input shape. */
export function sanitizeConfig(input: unknown): AppConfig {
  const raw = (typeof input === 'object' && input !== null ? input : {}) as Partial<AppConfig>

  const scene = SCENE_IDS.includes(raw.scene as SceneId) ? (raw.scene as SceneId) : DEFAULT_CONFIG.scene

  const lastDurationMs =
    typeof raw.lastDurationMs === 'number' &&
    Number.isFinite(raw.lastDurationMs) &&
    raw.lastDurationMs >= 60_000 &&
    raw.lastDurationMs <= 4 * 60 * 60 * 1000
      ? raw.lastDurationMs
      : DEFAULT_CONFIG.lastDurationMs

  return {
    scene,
    ambientVolume: clamp01(raw.ambientVolume, DEFAULT_CONFIG.ambientVolume),
    notifVolume: clamp01(raw.notifVolume, DEFAULT_CONFIG.notifVolume),
    lastDurationMs,
    alwaysOnTop: raw.alwaysOnTop === true
  }
}
