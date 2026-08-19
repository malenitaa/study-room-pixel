import type { Strings } from '../i18n/strings'

interface VolumeControlsProps {
  t: Strings
  ambientVolume: number
  notifVolume: number
  onAmbientChange: (value: number) => void
  onNotifChange: (value: number) => void
}

export function VolumeControls({
  t,
  ambientVolume,
  notifVolume,
  onAmbientChange,
  onNotifChange
}: VolumeControlsProps): JSX.Element {
  return (
    <div className="pixel-panel volume-controls">
      <label>
        <span>{t.ambient}</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={ambientVolume}
          onChange={(e) => onAmbientChange(Number(e.target.value))}
        />
      </label>
      <label>
        <span>{t.notification}</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={notifVolume}
          onChange={(e) => onNotifChange(Number(e.target.value))}
        />
      </label>
    </div>
  )
}
