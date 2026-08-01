import { useCallback, useEffect, useRef, useState } from 'react'

export type TimerStatus = 'idle' | 'running' | 'paused' | 'done'

export interface UseTimerResult {
  status: TimerStatus
  remainingMs: number
  durationMs: number
  start: (durationMs: number) => void
  pause: () => void
  resume: () => void
  reset: () => void
}

/**
 * Timer basado en timestamps reales: guardamos el instante de fin (endAt) y en cada tick
 * recalculamos `endAt - Date.now()`. El setInterval solo dispara el recálculo, nunca acumula
 * tiempo — si la máquina se duerme, al despertar el próximo tick calcula el remaining correcto.
 */
export function useTimer(initialDurationMs: number, onDone: () => void): UseTimerResult {
  const [status, setStatus] = useState<TimerStatus>('idle')
  const [durationMs, setDurationMs] = useState(initialDurationMs)
  const [remainingMs, setRemainingMs] = useState(initialDurationMs)

  const endAtRef = useRef<number | null>(null)
  const pausedRemainingRef = useRef<number>(initialDurationMs)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    if (status !== 'running') return undefined

    const tick = (): void => {
      const endAt = endAtRef.current
      if (endAt === null) return
      const remaining = endAt - Date.now()
      if (remaining <= 0) {
        setRemainingMs(0)
        setStatus('done')
        onDoneRef.current()
        return
      }
      setRemainingMs(remaining)
    }

    tick()
    const id = window.setInterval(tick, 250)
    return () => window.clearInterval(id)
  }, [status])

  const start = useCallback((newDurationMs: number) => {
    setDurationMs(newDurationMs)
    endAtRef.current = Date.now() + newDurationMs
    setRemainingMs(newDurationMs)
    setStatus('running')
  }, [])

  const pause = useCallback(() => {
    setStatus((prev) => {
      if (prev !== 'running' || endAtRef.current === null) return prev
      pausedRemainingRef.current = Math.max(0, endAtRef.current - Date.now())
      return 'paused'
    })
  }, [])

  const resume = useCallback(() => {
    setStatus((prev) => {
      if (prev !== 'paused') return prev
      endAtRef.current = Date.now() + pausedRemainingRef.current
      return 'running'
    })
  }, [])

  const reset = useCallback(() => {
    endAtRef.current = null
    pausedRemainingRef.current = durationMs
    setRemainingMs(durationMs)
    setStatus('idle')
  }, [durationMs])

  return { status, remainingMs, durationMs, start, pause, resume, reset }
}
