import { useState } from 'react'
import type { UseTimerResult } from '../timer/useTimer'
import type { Strings } from '../i18n/strings'

const PRESETS_MIN = [15, 25, 50]

function formatTime(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

interface TimerProps {
  t: Strings
  timer: UseTimerResult
  onStart: (durationMs: number) => void
}

export function Timer({ t, timer, onStart }: TimerProps): JSX.Element {
  const [customMinutes, setCustomMinutes] = useState('25')

  const startWithMinutes = (minutes: number): void => {
    const clamped = Math.min(240, Math.max(1, minutes))
    onStart(clamped * 60 * 1000)
  }

  return (
    <div className="pixel-panel timer">
      <div className="timer-display">{formatTime(timer.remainingMs)}</div>

      {timer.status === 'idle' || timer.status === 'done' ? (
        <>
          <div className="timer-presets">
            {PRESETS_MIN.map((min) => (
              <button key={min} onClick={() => startWithMinutes(min)}>
                {min}m
              </button>
            ))}
          </div>
          <div className="timer-custom">
            <input
              type="number"
              min={1}
              max={240}
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
            />
            <button onClick={() => startWithMinutes(Number(customMinutes) || 25)}>{t.start}</button>
          </div>
        </>
      ) : (
        <div className="timer-controls">
          {timer.status === 'running' ? (
            <button onClick={timer.pause}>{t.pause}</button>
          ) : (
            <button onClick={timer.resume}>{t.resume}</button>
          )}
          <button onClick={timer.reset}>{t.reset}</button>
        </div>
      )}
    </div>
  )
}
