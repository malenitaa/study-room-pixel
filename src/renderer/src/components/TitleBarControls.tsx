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
      <button className={alwaysOnTop ? 'active' : ''} onClick={onToggleAlwaysOnTop} title="Siempre visible arriba">
        📌
      </button>
      <button className={fullScreen ? 'active' : ''} onClick={onToggleFullScreen} title="Pantalla completa">
        ⛶
      </button>
    </div>
  )
}
