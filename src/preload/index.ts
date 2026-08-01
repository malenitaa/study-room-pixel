import { contextBridge, ipcRenderer } from 'electron'
import type { AppConfig } from '../shared/config'

/**
 * Superficie mínima expuesta al renderer. Nada de ipcRenderer crudo, nada de Node:
 * solo estas cuatro funciones puntuales, cada una atada a un canal fijo.
 */
const api = {
  getConfig: (): Promise<AppConfig> => ipcRenderer.invoke('config:get'),
  setConfig: (partial: Partial<AppConfig>): Promise<AppConfig> => ipcRenderer.invoke('config:set', partial),
  setFullScreen: (value: boolean): Promise<boolean> => ipcRenderer.invoke('window:setFullScreen', value),
  isFullScreen: (): Promise<boolean> => ipcRenderer.invoke('window:isFullScreen')
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
