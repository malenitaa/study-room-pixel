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

const CROSSFADE_MS = 450

/**
 * Dos <audio> independientes (ambiente en loop / chime puntual) en vez de Web Audio API:
 * así el audio local cae bajo `media-src 'self'` de la CSP y nunca necesitamos `connect-src`.
 *
 * El ambiente usa doble buffer (dos <audio> fijos, creados una sola vez en el constructor):
 * al cambiar de escena, el track entrante arranca en silencio y el saliente se desvanece,
 * cruzando volúmenes con requestAnimationFrame en vez de cortar/reiniciar de golpe. Como los
 * dos elementos son fijos y se reusan siempre, no hay <audio> nuevos por cada cambio de escena
 * (nada que limpiar/leakear).
 */
export class AudioManager {
  private tracks: [HTMLAudioElement, HTMLAudioElement] = [new Audio(), new Audio()]
  private activeIndex = 0
  private notif = new Audio(chimeUrl)
  private currentScene: SceneId | null = null
  private masterAmbientVolume = 1
  private fadeRaf: number | null = null

  constructor() {
    this.tracks[0].loop = true
    this.tracks[1].loop = true
    this.tracks[0].volume = 0
    this.tracks[1].volume = 0
  }

  setScene(scene: SceneId): void {
    if (scene === this.currentScene) return
    this.currentScene = scene

    const outgoingIndex = this.activeIndex
    const incomingIndex = outgoingIndex === 0 ? 1 : 0
    const outgoing = this.tracks[outgoingIndex]
    const incoming = this.tracks[incomingIndex]

    incoming.src = SCENE_AUDIO[scene]
    incoming.currentTime = 0
    incoming.volume = 0
    void incoming.play().catch(() => undefined)

    this.activeIndex = incomingIndex
    this.crossfade(incoming, outgoing)
  }

  private crossfade(incoming: HTMLAudioElement, outgoing: HTMLAudioElement): void {
    if (this.fadeRaf !== null) cancelAnimationFrame(this.fadeRaf)

    const start = performance.now()
    const outgoingStartVolume = outgoing.volume
    const targetVolume = this.masterAmbientVolume

    const step = (now: number): void => {
      const t = Math.min(1, (now - start) / CROSSFADE_MS)
      incoming.volume = targetVolume * t
      outgoing.volume = outgoingStartVolume * (1 - t)

      if (t < 1) {
        this.fadeRaf = requestAnimationFrame(step)
        return
      }

      outgoing.pause()
      outgoing.currentTime = 0
      this.fadeRaf = null
    }

    this.fadeRaf = requestAnimationFrame(step)
  }

  async playAmbient(): Promise<void> {
    try {
      await this.tracks[this.activeIndex].play()
    } catch {
      // Autoplay bloqueado hasta el primer gesto del usuario (click en play/escena); no es un error real.
    }
  }

  pauseAmbient(): void {
    this.tracks[0].pause()
    this.tracks[1].pause()
  }

  setAmbientVolume(volume: number): void {
    this.masterAmbientVolume = volume
    // Si hay un crossfade en curso, el rAF de crossfade() ya controla el volumen del track activo.
    if (this.fadeRaf === null) {
      this.tracks[this.activeIndex].volume = volume
    }
  }

  setNotifVolume(volume: number): void {
    this.notif.volume = volume
  }

  playNotification(): void {
    this.notif.currentTime = 0
    void this.notif.play().catch(() => undefined)
  }

  dispose(): void {
    this.tracks[0].pause()
    this.tracks[1].pause()
    this.notif.pause()
  }
}
