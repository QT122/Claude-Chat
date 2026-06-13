import { ipcMain } from 'electron'
import { saveMemory, loadMemory, listMemories, deleteMemory } from '../services/memory-store'

export function registerMemoryHandlers(): void {
  ipcMain.handle('mem:save', (_event, memory: { id: string; title: string; content: string; type: string; createdAt: number; updatedAt: number }) => {
    try {
      saveMemory(memory)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('mem:get', (_event, id: string) => {
    try {
      const memory = loadMemory(id)
      return { memory }
    } catch (err) {
      return { memory: null, error: String(err) }
    }
  })

  ipcMain.handle('mem:list', () => {
    try {
      const memories = listMemories()
      return { memories }
    } catch (err) {
      return { memories: [], error: String(err) }
    }
  })

  ipcMain.handle('mem:delete', (_event, id: string) => {
    try {
      const success = deleteMemory(id)
      return { success }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })
}
