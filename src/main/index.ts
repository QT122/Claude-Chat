import { app, BrowserWindow, protocol, session } from 'electron'
import { createWindow } from './window'
import { registerAllHandlers } from './ipc'
import { join } from 'path'
import { existsSync, readFileSync } from 'fs'

// Fix GPU cache permission errors on Windows
app.setPath('userData', join(app.getPath('appData'), 'claude-chat'))
app.commandLine.appendSwitch('disable-gpu-sandbox')
app.commandLine.appendSwitch('disable-software-rasterizer')

// Register custom protocol to serve generated images
protocol.registerSchemesAsPrivileged([
  { scheme: 'local-img', privileges: { standard: true, secure: true, bypassCSP: true, stream: true, supportFetchAPI: true } },
])

app.whenReady().then(() => {
  // Allow geolocation permission requests from renderer
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    if (permission === 'geolocation') {
      callback(true)
    } else {
      callback(false)
    }
  })

  // Handle local-img:// protocol for generated images
  protocol.handle('local-img', (request) => {
    try {
      const url = new URL(request.url)
      let fileName = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname
      if (!fileName) throw new Error('no filename')

      const filePath = join(app.getPath('userData'), 'generated', fileName)
      if (!existsSync(filePath)) {
        return new Response('Image not found', { status: 404 })
      }

      const data = readFileSync(filePath)
      const ext = fileName.split('.').pop()?.toLowerCase()
      const mimeMap: Record<string, string> = {
        png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
        gif: 'image/gif', webp: 'image/webp', bmp: 'image/bmp',
        mp4: 'video/mp4', webm: 'video/webm',
      }
      return new Response(data, {
        headers: { 'Content-Type': mimeMap[ext || ''] || 'image/png' },
      })
    } catch (err) {
      console.error('local-img protocol error:', err)
      return new Response('Invalid request', { status: 400 })
    }
  })

  registerAllHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
