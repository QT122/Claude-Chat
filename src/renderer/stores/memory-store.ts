import { create } from 'zustand'
import type { Memory } from '../types/message'

interface MemoryState {
  memories: Memory[]
  editingMemory: Memory | null
  loadMemories: () => Promise<void>
  saveMemory: (mem: Memory) => Promise<void>
  deleteMemory: (id: string) => Promise<void>
  setEditingMemory: (mem: Memory | null) => void
}

export const useMemoryStore = create<MemoryState>((set, get) => ({
  memories: [],
  editingMemory: null,

  loadMemories: async () => {
    try {
      const result = await window.api.listMemories()
      set({ memories: result.memories as Memory[] })
    } catch { /* ignore */ }
  },

  saveMemory: async (mem) => {
    await window.api.saveMemory({
      ...mem,
      updatedAt: Date.now(),
    })
    await get().loadMemories()
  },

  deleteMemory: async (id) => {
    await window.api.deleteMemory(id)
    await get().loadMemories()
  },

  setEditingMemory: (mem) => set({ editingMemory: mem }),
}))
