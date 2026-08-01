import rainUrl from '../../../../resources/audio/rain.wav'
import fireplaceUrl from '../../../../resources/audio/fireplace.wav'
import cafeUrl from '../../../../resources/audio/cafe.wav'
import libraryUrl from '../../../../resources/audio/library.wav'
import chimeUrl from '../../../../resources/audio/chime.wav'
import type { SceneId } from '../../../shared/config'

const SCENE_AUDIO: Record<SceneId, string> = {
  rain: rainUrl,
  fireplace: fireplaceUrl,
  cafe: cafeUrl,
  library: libraryUrl
}

/**
 * Dos <audio> independientes (ambiente en loop / chime puntual) en vez de Web Audio API:
 * así el audio local cae bajo `media-src 'self'` de la CSP y nunca necesitamos `connect-src`.
 */
export class AudioManager {
  private ambient = new Audio()
  private notif = new Audio(chimeUrl)
  private currentScene: SceneId | null = null

  constructor() {
    this.ambient.loop = true
  }

  setScene(scene: SceneId): void {
    if (scene === this.currentScene) return
    const wasPlaying = !this.ambient.paused
    this.currentScene = scene
    this.ambient.src = SCENE_AUDIO[scene]
    if (wasPlaying) void this.ambient.play()
  }

  async playAmbient(): Promise<void> {
    try {
      await this.ambient.play()
    } catch {
      // Autoplay bloqueado hasta el primer gesto del usuario (click en play/escena); no es un error real.
    }
  }

  pauseAmbient(): void {
    this.ambient.pause()
  }

  setAmbientVolume(volume: number): void {
    this.ambient.volume = volume
  }

  setNotifVolume(volume: number): void {
    this.notif.volume = volume
  }

  playNotification(): void {
    this.notif.currentTime = 0
    void this.notif.play().catch(() => undefined)
  }

  dispose(): void {
    this.ambient.pause()
    this.notif.pause()
  }
}
