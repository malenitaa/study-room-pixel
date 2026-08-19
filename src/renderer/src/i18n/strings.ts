import type { LanguageSetting, SceneId } from '../../../shared/config'

// English is the typed source of truth: `es` must provide exactly the same
// keys or the build fails typecheck.
const en = {
  loading: 'Loading…',
  sceneRain: 'Rain',
  sceneFireplace: 'Fireplace',
  sceneCafe: 'Cafe',
  sceneLibrary: 'Library',
  alwaysOnTop: 'Always on top',
  fullscreen: 'Fullscreen',
  language: 'Language',
  start: 'Start',
  pause: 'Pause',
  resume: 'Resume',
  reset: 'Reset',
  ambient: 'Ambient',
  notification: 'Notification'
}

export type Strings = Record<keyof typeof en, string>

const es: Strings = {
  loading: 'Cargando…',
  sceneRain: 'Lluvia',
  sceneFireplace: 'Hogar',
  sceneCafe: 'Café',
  sceneLibrary: 'Biblioteca',
  alwaysOnTop: 'Siempre visible arriba',
  fullscreen: 'Pantalla completa',
  language: 'Idioma',
  start: 'Iniciar',
  pause: 'Pausar',
  resume: 'Reanudar',
  reset: 'Reiniciar',
  ambient: 'Ambiente',
  notification: 'Notificación'
}

export const STRINGS: Record<'en' | 'es', Strings> = { en, es }

export const SCENE_LABEL_KEY: Record<SceneId, keyof Strings> = {
  rain: 'sceneRain',
  fireplace: 'sceneFireplace',
  cafe: 'sceneCafe',
  library: 'sceneLibrary'
}

/** "auto" follows the system locale; explicit choices win. */
export function resolveLanguage(setting: LanguageSetting): 'en' | 'es' {
  if (setting === 'en' || setting === 'es') return setting
  return String(navigator.language || '')
    .toLowerCase()
    .startsWith('es')
    ? 'es'
    : 'en'
}

export function getStrings(setting: LanguageSetting): Strings {
  return STRINGS[resolveLanguage(setting)]
}
