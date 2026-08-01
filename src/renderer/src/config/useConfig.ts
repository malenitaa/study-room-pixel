import { useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_CONFIG, type AppConfig } from '../../../shared/config'

const PERSIST_DEBOUNCE_MS = 300

export interface UseConfigResult {
  config: AppConfig
  ready: boolean
  update: (partial: Partial<AppConfig>) => void
}

/**
 * Estado optimista en memoria (aplica al instante) + persistencia a disco debounced y acumulada,
 * para no bloquear el main process con un writeFileSync por cada tick de un slider de volumen.
 */
export function useConfig(): UseConfigResult {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG)
  const [ready, setReady] = useState(false)
  const debounceRef = useRef<number | null>(null)
  const pendingRef = useRef<Partial<AppConfig>>({})

  useEffect(() => {
    let cancelled = false
    window.api.getConfig().then((loaded) => {
      if (!cancelled) {
        setConfig(loaded)
        setReady(true)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const update = useCallback((partial: Partial<AppConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }))
    pendingRef.current = { ...pendingRef.current, ...partial }

    if (debounceRef.current !== null) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => {
      const toPersist = pendingRef.current
      pendingRef.current = {}
      void window.api.setConfig(toPersist)
    }, PERSIST_DEBOUNCE_MS)
  }, [])

  return { config, ready, update }
}
