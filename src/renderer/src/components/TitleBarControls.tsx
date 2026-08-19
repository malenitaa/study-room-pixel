import type { LanguageSetting } from '../../../shared/config'
import type { Strings } from '../i18n/strings'

const LANGUAGE_CYCLE: LanguageSetting[] = ['auto', 'en', 'es']

interface TitleBarControlsProps {
  t: Strings
  alwaysOnTop: boolean
  fullScreen: boolean
  language: LanguageSetting
  onToggleAlwaysOnTop: () => void
  onToggleFullScreen: () => void
  onLanguageChange: (language: LanguageSetting) => void
}

export function TitleBarControls({
  t,
  alwaysOnTop,
  fullScreen,
  language,
  onToggleAlwaysOnTop,
  onToggleFullScreen,
  onLanguageChange
}: TitleBarControlsProps): JSX.Element {
  const nextLanguage = (): LanguageSetting =>
    LANGUAGE_CYCLE[(LANGUAGE_CYCLE.indexOf(language) + 1) % LANGUAGE_CYCLE.length]

  return (
    <div className="titlebar-controls">
      <button className={alwaysOnTop ? 'active' : ''} onClick={onToggleAlwaysOnTop} title={t.alwaysOnTop}>
        📌
      </button>
      <button className={fullScreen ? 'active' : ''} onClick={onToggleFullScreen} title={t.fullscreen}>
        ⛶
      </button>
      <button className="lang-toggle" onClick={() => onLanguageChange(nextLanguage())} title={t.language}>
        {language.toUpperCase()}
      </button>
    </div>
  )
}
