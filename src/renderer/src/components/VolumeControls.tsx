interface VolumeControlsProps {
  ambientVolume: number
  notifVolume: number
  onAmbientChange: (value: number) => void
  onNotifChange: (value: number) => void
}

export function VolumeControls({
  ambientVolume,
  notifVolume,
  onAmbientChange,
  onNotifChange
}: VolumeControlsProps): JSX.Element {
  return (
    <div className="pixel-panel volume-controls">
      <label>
        <span>Ambiente</span>
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
        <span>Notificación</span>
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
