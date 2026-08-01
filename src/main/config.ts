import { app } from 'electron'
import { join } from 'node:path'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { DEFAULT_CONFIG, sanitizeConfig, type AppConfig } from '../shared/config'

function configPath(): string {
  return join(app.getPath('userData'), 'config.json')
}

export function loadConfig(): AppConfig {
  const path = configPath()
  if (!existsSync(path)) return { ...DEFAULT_CONFIG }

  try {
    const raw = JSON.parse(readFileSync(path, 'utf-8'))
    return sanitizeConfig(raw)
  } catch {
    // Config corrupto o ilegible: no rompemos el arranque, volvemos a defaults.
    return { ...DEFAULT_CONFIG }
  }
}

export function saveConfig(partial: Partial<AppConfig>): AppConfig {
  const current = loadConfig()
  const next = sanitizeConfig({ ...current, ...partial })

  const dir = app.getPath('userData')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(configPath(), JSON.stringify(next, null, 2), 'utf-8')

  return next
}
