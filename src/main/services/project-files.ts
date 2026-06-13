import { watch, FSWatcher } from 'chokidar'
import type { BrowserWindow } from 'electron'

let watcher: FSWatcher | null = null

export function startWatching(projectDir: string, win: BrowserWindow): void {
  stopWatching()

  watcher = watch(projectDir, {
    ignored: /(^|[/\\])(\..|node_modules)/,
    persistent: true,
    ignoreInitial: true,
    depth: 10,
  })

  watcher.on('all', (event, filePath) => {
    win.webContents.send('fs:change', {
      event,
      filePath: filePath.replace(projectDir, '').replace(/^[/\\]/, ''),
    })
  })

  watcher.on('error', (err) => {
    console.error('File watcher error:', err)
  })
}

export function stopWatching(): void {
  if (watcher) {
    watcher.close()
    watcher = null
  }
}
