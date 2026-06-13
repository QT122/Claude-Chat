import { ipcMain } from 'electron'
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'

function getBgPath(): string {
  return join(app.getPath('userData'), 'background.png')
}

function getSettingsPath(): string {
  const dir = app.getPath('userData')
  return join(dir, 'app-settings.json')
}

function loadSettings(): Record<string, unknown> {
  try {
    const path = getSettingsPath()
    if (!existsSync(path)) return {}
    return JSON.parse(readFileSync(path, 'utf-8'))
  } catch {
    return {}
  }
}

function saveSetting(key: string, value: unknown): void {
  const settings = loadSettings()
  settings[key] = value
  writeFileSync(getSettingsPath(), JSON.stringify(settings, null, 2), 'utf-8')
}

export function registerAppSettingsHandlers(): void {
  ipcMain.handle('settings:get', (_event, key: string) => {
    const settings = loadSettings()
    return { value: settings[key] ?? null }
  })

  ipcMain.handle('settings:set', (_event, key: string, value: unknown) => {
    saveSetting(key, value)
    return { success: true }
  })

  // Background image persistence
  ipcMain.handle('bg:save', (_event, dataUrl: string) => {
    try {
      const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '')
      writeFileSync(getBgPath(), Buffer.from(base64, 'base64'))
      return { success: true }
    } catch {
      return { success: false }
    }
  })

  ipcMain.handle('bg:load', () => {
    try {
      if (!existsSync(getBgPath())) return { dataUrl: null }
      const buffer = readFileSync(getBgPath())
      return { dataUrl: `data:image/png;base64,${buffer.toString('base64')}` }
    } catch {
      return { dataUrl: null }
    }
  })
}
