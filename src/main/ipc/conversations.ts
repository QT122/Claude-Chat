import { ipcMain } from 'electron'
import { saveConversation, loadConversation, listConversations, deleteConversation } from '../services/message-store'
import { deleteMemoriesByConversation } from '../services/memory-store'

export function registerConversationHandlers(): void {
  ipcMain.handle('conv:save', (_event, conversation: { id: string; title: string; messages: unknown[]; createdAt: number; updatedAt: number; mode?: string }) => {
    try {
      saveConversation(conversation)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('conv:load', (_event, id: string) => {
    try {
      const conv = loadConversation(id)
      return { conversation: conv }
    } catch (err) {
      return { conversation: null, error: String(err) }
    }
  })

  ipcMain.handle('conv:list', (_event, mode?: string) => {
    try {
      const all = listConversations()
      const filtered = mode ? all.filter((c: any) => (c.mode || 'chat') === mode) : all
      return { conversations: filtered }
    } catch (err) {
      return { conversations: [], error: String(err) }
    }
  })

  ipcMain.handle('conv:delete', (_event, id: string) => {
    try {
      const success = deleteConversation(id)
      if (success) {
        deleteMemoriesByConversation(id)
      }
      return { success }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })
}
