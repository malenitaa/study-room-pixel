import { useEffect, useMemo } from 'react'
import { AudioManager } from './AudioManager'
import type { SceneId } from '../../../shared/config'

let singleton: AudioManager | null = null
function getManager(): AudioManager {
  if (!singleton) singleton = new AudioManager()
  return singleton
}

/**
 * El navegador (política de autoplay de Chromium) puede bloquear el play() inicial hasta el
 * primer gesto real del usuario. El efecto de abajo lo intenta igual (falla en silencio si
 * corresponde); los componentes que disparan gestos de usuario (click en escena, click en
 * "iniciar" del timer) también llaman a manager.playAmbient() directamente para desbloquearlo.
 */
export function useAmbientAudio(scene: SceneId, ambientVolume: number, notifVolume: number): AudioManager {
  const manager = useMemo(() => getManager(), [])

  useEffect(() => {
    manager.setScene(scene)
    void manager.playAmbient()
  }, [manager, scene])

  useEffect(() => {
    manager.setAmbientVolume(ambientVolume)
  }, [manager, ambientVolume])

  useEffect(() => {
    manager.setNotifVolume(notifVolume)
  }, [manager, notifVolume])

  return manager
}
