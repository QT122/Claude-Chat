import { ipcMain } from 'electron'
import { loadMediaRecords, markDownloaded, deleteMedia, getMediaDataUrl, cleanupExpiredMedia } from '../services/media-store'

export function registerMediaHandlers(): void {
  ipcMain.handle('media:list', async () => {
    return { media: loadMediaRecords() }
  })

  ipcMain.handle('media:download', async (_event, filename: string) => {
    markDownloaded(filename)
    return { success: true }
  })

  ipcMain.handle('media:delete', async (_event, filename: string) => {
    const success = deleteMedia(filename)
    return { success }
  })

  ipcMain.handle('media:get-data-url', async (_event, filename: string) => {
    const dataUrl = getMediaDataUrl(filename)
    return { dataUrl }
  })
}
