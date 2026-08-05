interface TitleBarControlsProps {
  alwaysOnTop: boolean
  fullScreen: boolean
  onToggleAlwaysOnTop: () => void
  onToggleFullScreen: () => void
}

export function TitleBarControls({
  alwaysOnTop,
  fullScreen,
  onToggleAlwaysOnTop,
  onToggleFullScreen
}: TitleBarControlsProps): JSX.Element {
  return (
    <div className="titlebar-controls">
      <button className={alwaysOnTop ? 'active' : ''} onClick={onToggleAlwaysOnTop} title="Always on top">
        📌
      </button>
      <button className={fullScreen ? 'active' : ''} onClick={onToggleFullScreen} title="Fullscreen">
        ⛶
      </button>
    </div>
  )
}
