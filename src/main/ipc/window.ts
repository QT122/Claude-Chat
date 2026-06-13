import { ipcMain, BrowserWindow, shell } from 'electron'

export function registerWindowHandlers(): void {
  ipcMain.handle('win:minimize', () => {
    BrowserWindow.getFocusedWindow()?.minimize()
  })

  ipcMain.handle('win:maximize', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win?.isMaximized()) {
      win.unmaximize()
    } else {
      win?.maximize()
    }
  })

  ipcMain.handle('win:close', () => {
    BrowserWindow.getFocusedWindow()?.close()
  })

  ipcMain.handle('win:is-maximized', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    return win?.isMaximized() ?? false
  })

  ipcMain.handle('win:open-external', (_event, url: string) => {
    // Only allow http/https URLs
    if (url.startsWith('https://') || url.startsWith('http://')) {
      shell.openExternal(url)
    }
  })
}
