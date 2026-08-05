import { useCallback, useEffect, useState } from 'react'
import { SceneView } from './components/SceneView'
import { SceneSelector } from './components/SceneSelector'
import { Timer } from './components/Timer'
import { VolumeControls } from './components/VolumeControls'
import { TitleBarControls } from './components/TitleBarControls'
import { useConfig } from './config/useConfig'
import { useTimer } from './timer/useTimer'
import { useAmbientAudio } from './audio/useAmbientAudio'
import type { SceneId } from '../../shared/config'

export default function App(): JSX.Element {
  const { config, ready, update } = useConfig()
  const [fullScreen, setFullScreen] = useState(false)

  const audio = useAmbientAudio(config.scene, config.ambientVolume, config.notifVolume)
  const timer = useTimer(config.lastDurationMs, () => audio.playNotification())

  useEffect(() => {
    window.api.isFullScreen().then(setFullScreen)
  }, [])

  const handleSelectScene = useCallback(
    (scene: SceneId) => {
      update({ scene })
      void audio.playAmbient()
    },
    [update, audio]
  )

  const handleStartTimer = useCallback(
    (durationMs: number) => {
      timer.start(durationMs)
      update({ lastDurationMs: durationMs })
      void audio.playAmbient()
    },
    [timer, update, audio]
  )

  const toggleAlwaysOnTop = useCallback(() => {
    update({ alwaysOnTop: !config.alwaysOnTop })
  }, [update, config.alwaysOnTop])

  const toggleFullScreen = useCallback(() => {
    void window.api.setFullScreen(!fullScreen).then(setFullScreen)
  }, [fullScreen])

  if (!ready) {
    return <div className="app app-loading">Loading…</div>
  }

  return (
    <div className="app">
      <SceneView sceneId={config.scene} />

      <div className="hud">
        <div className="hud-top">
          <SceneSelector current={config.scene} onSelect={handleSelectScene} />
          <TitleBarControls
            alwaysOnTop={config.alwaysOnTop}
            fullScreen={fullScreen}
            onToggleAlwaysOnTop={toggleAlwaysOnTop}
            onToggleFullScreen={toggleFullScreen}
          />
        </div>

        <div className="hud-bottom">
          <Timer timer={timer} onStart={handleStartTimer} />
          <VolumeControls
            ambientVolume={config.ambientVolume}
            notifVolume={config.notifVolume}
            onAmbientChange={(v) => update({ ambientVolume: v })}
            onNotifChange={(v) => update({ notifVolume: v })}
          />
        </div>
      </div>
    </div>
  )
}
