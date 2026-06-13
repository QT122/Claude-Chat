import { ipcMain, dialog, BrowserWindow } from 'electron'
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'

function getAvatarPath(): string {
  return join(app.getPath('userData'), 'avatar.png')
}

export function registerAvatarHandlers(): void {
  ipcMain.handle('avatar:pick', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return { dataUrl: null, canceled: true }

    const result = await dialog.showOpenDialog(win, {
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'] }],
      properties: ['openFile'],
    })

    if (result.canceled || result.filePaths.length === 0) {
      return { dataUrl: null, canceled: true }
    }

    try {
      const filePath = result.filePaths[0]
      const buffer = readFileSync(filePath)
      const ext = filePath.split('.').pop()?.toLowerCase() || 'png'
      const mime = ext === 'jpg' ? 'jpeg' : ext
      const dataUrl = `data:image/${mime};base64,${buffer.toString('base64')}`

      // Save to userData
      writeFileSync(getAvatarPath(), buffer)

      return { dataUrl, canceled: false }
    } catch (err) {
      return { dataUrl: null, canceled: true, error: String(err) }
    }
  })

  ipcMain.handle('avatar:load', () => {
    try {
      const avatarPath = getAvatarPath()
      if (!existsSync(avatarPath)) return { dataUrl: null }

      const buffer = readFileSync(avatarPath)
      const dataUrl = `data:image/png;base64,${buffer.toString('base64')}`
      return { dataUrl }
    } catch {
      return { dataUrl: null }
    }
  })

  ipcMain.handle('avatar:delete', () => {
    try {
      const avatarPath = getAvatarPath()
      if (existsSync(avatarPath)) unlinkSync(avatarPath)
      return { success: true }
    } catch {
      return { success: false }
    }
  })
}
