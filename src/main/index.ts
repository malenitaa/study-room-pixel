import { app, BrowserWindow, Menu, ipcMain, session } from 'electron'
import { join } from 'node:path'
import { loadConfig, saveConfig } from './config'
import type { AppConfig } from '../shared/config'

const CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data:; media-src 'self'; connect-src 'none'; object-src 'none'"

const isDev = !app.isPackaged

// Sandboxea todos los renderers de la app (además del sandbox por-ventana declarado abajo).
app.enableSandbox()

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  const config = loadConfig()

  mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    minWidth: 480,
    minHeight: 320,
    show: false,
    alwaysOnTop: config.alwaysOnTop,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())

  // Nunca navegar afuera de la app ni abrir ventanas/tabs nuevas.
  mainWindow.webContents.on('will-navigate', (event) => event.preventDefault())
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function registerSecurityPolicies(): void {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [CSP]
      }
    })
  })

  // No hay ninguna razón legítima para que esta app pida permisos (mic, cámara, notificaciones, etc).
  session.defaultSession.setPermissionRequestHandler((_wc, _permission, callback) => callback(false))

  // Bloquea la creación de <webview> y cualquier navegación de ventanas nuevas a nivel sesión.
  app.on('web-contents-created', (_event, contents) => {
    contents.on('will-attach-webview', (event) => event.preventDefault())
    contents.setWindowOpenHandler(() => ({ action: 'deny' }))
  })
}

function registerIpcHandlers(): void {
  ipcMain.handle('config:get', () => loadConfig())

  ipcMain.handle('config:set', (_event, partial: Partial<AppConfig>) => {
    const next = saveConfig(partial)
    if (typeof partial.alwaysOnTop === 'boolean') {
      mainWindow?.setAlwaysOnTop(partial.alwaysOnTop)
    }
    return next
  })

  ipcMain.handle('window:setFullScreen', (_event, value: boolean) => {
    mainWindow?.setFullScreen(value)
    return mainWindow?.isFullScreen() ?? false
  })

  ipcMain.handle('window:isFullScreen', () => mainWindow?.isFullScreen() ?? false)
}

function buildMenu(): void {
  if (process.platform !== 'darwin') {
    Menu.setApplicationMenu(null)
    return
  }

  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: app.name,
      submenu: [{ role: 'quit' }]
    },
    {
      label: 'Edit',
      submenu: [{ role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }]
    }
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

app.whenReady().then(() => {
  registerSecurityPolicies()
  registerIpcHandlers()
  buildMenu()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
