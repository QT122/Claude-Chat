import { create } from 'zustand'
import type { Message, ToolCall, MediaItem } from '../types/message'

interface ConversationState {
  messages: Message[]
  isStreaming: boolean
  currentTitle: string
  conversationId: string

  addMessage: (msg: Message) => void
  appendToken: (token: string) => void
  setStreaming: (val: boolean) => void
  finalizeMessage: () => void
  clearMessages: () => void
  upsertToolCall: (toolCallId: string, update: Partial<ToolCall>) => void
  addMediaToLastMessage: (media: MediaItem) => void
  setTitle: (title: string) => void
  setConversationId: (id: string) => void
}

export const useConversationStore = create<ConversationState>((set) => ({
  messages: [],
  isStreaming: false,
  currentTitle: '',
  conversationId: '',

  addMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages, msg],
    })),

  appendToken: (token) =>
    set((state) => {
      const msgs = [...state.messages]
      const last = msgs[msgs.length - 1]
      if (last && last.role === 'assistant' && last.isStreaming) {
        msgs[msgs.length - 1] = { ...last, content: last.content + token }
      }
      return { messages: msgs }
    }),

  setStreaming: (val) => set({ isStreaming: val }),

  finalizeMessage: () =>
    set((state) => {
      const msgs = [...state.messages]
      const last = msgs[msgs.length - 1]
      if (last && last.isStreaming) {
        msgs[msgs.length - 1] = { ...last, isStreaming: false }
      }
      return { messages: msgs, isStreaming: false }
    }),

  clearMessages: () => set({ messages: [], isStreaming: false, currentTitle: '', conversationId: '' }),
  setConversationId: (id) => set({ conversationId: id }),

  upsertToolCall: (toolCallId, update) =>
    set((state) => {
      const msgs = [...state.messages]
      const last = msgs[msgs.length - 1]
      if (!last || last.role !== 'assistant') return { messages: msgs }

      const existing = last.toolCalls || []
      const idx = existing.findIndex((tc) => tc.id === toolCallId)

      if (idx >= 0) {
        const updated = [...existing]
        updated[idx] = { ...updated[idx], ...update }
        msgs[msgs.length - 1] = { ...last, toolCalls: updated }
      } else {
        const newCall: ToolCall = {
          id: toolCallId,
          name: update.name || 'unknown',
          input: update.input || '',
          output: update.output || null,
          status: update.status || 'pending',
          isError: update.isError || false,
        }
        msgs[msgs.length - 1] = { ...last, toolCalls: [...existing, newCall] }
      }

      return { messages: msgs }
    }),

  addMediaToLastMessage: (media) =>
    set((state) => {
      const msgs = [...state.messages]
      const last = msgs[msgs.length - 1]
      if (!last || last.role !== 'assistant') return { messages: msgs }
      const existing = last.mediaItems || []
      msgs[msgs.length - 1] = { ...last, mediaItems: [...existing, media] }
      return { messages: msgs }
    }),

  setTitle: (title) => set({ currentTitle: title }),
}))
