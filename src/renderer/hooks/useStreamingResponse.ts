import { useCallback, useEffect } from 'react'
import { useConversationStore } from '../stores/conversation-store'
import { useSettingsStore } from '../stores/settings-store'
import { useModeStore } from '../stores/mode-store'
import { useSkillsStore } from '../stores/skills-store'
import type { FileAttachment } from '../types/message'

export function useStreamingResponse() {
  const { addMessage, appendToken, setStreaming, finalizeMessage, setTitle } = useConversationStore()
  const { model, projectDir, provider } = useSettingsStore()
  const mode = useModeStore((s) => s.mode)
  const activeSkillIds = useSkillsStore((s) => s.activeSkillIds)

  useEffect(() => {
    const unsubMedia = window.api.onMedia(({ media }) => {
      useConversationStore.getState().addMediaToLastMessage(media)
    })

    const unsubToken = window.api.onToken(({ token }) => {
      appendToken(token)
    })

    const unsubToolCall = window.api.onToolCall((data: unknown) => {
      const tc = data as { conversationId: string; toolCall: { id: string; name: string; status: string; input: string } }
      useConversationStore.getState().upsertToolCall(tc.toolCall.id, {
        id: tc.toolCall.id,
        name: tc.toolCall.name,
        input: tc.toolCall.input,
        output: null,
        status: tc.toolCall.status as 'pending' | 'parsing' | 'running' | 'done' | 'error',
        isError: false,
      })
    })

    const unsubToolResult = window.api.onToolResult((data: unknown) => {
      const tr = data as { conversationId: string; toolResult: { id: string; status: string; content: string; isError: boolean } }
      useConversationStore.getState().upsertToolCall(tr.toolResult.id, {
        status: tr.toolResult.status as 'done' | 'error',
        output: tr.toolResult.content,
        isError: tr.toolResult.isError,
      })
    })

    const unsubDone = window.api.onDone(() => {
      finalizeMessage()
      const msgs = useConversationStore.getState().messages
      if (msgs.length > 0) {
        // Strip large base64 data from media items before saving
        const toSave = msgs.map((m) => {
          if (!m.mediaItems || m.mediaItems.length === 0) return m
          return {
            ...m,
            mediaItems: m.mediaItems.map((item) => ({
              ...item,
              dataUrl: '', // Don't save base64 — reload from disk on load
            })),
          }
        })
        const userMsg = msgs.find((m) => m.role === 'user')
        const existingTitle = useConversationStore.getState().currentTitle
        const convId = useConversationStore.getState().conversationId
        const title = existingTitle || (userMsg?.content?.slice(0, 50) || '新对话')
        const currentMode = useModeStore.getState().mode
        window.api.saveConversation({
          id: convId,
          title,
          messages: toSave,
          createdAt: msgs[0]?.timestamp || Date.now(),
          updatedAt: Date.now(),
          mode: currentMode,
        })
      }
    })

    const unsubError = window.api.onError(({ error }) => {
      finalizeMessage()
      console.error('Stream error:', error)
    })

    return () => {
      unsubMedia()
      unsubToken()
      unsubToolCall()
      unsubToolResult()
      unsubDone()
      unsubError()
    }
  }, [appendToken, finalizeMessage, setTitle])

  const send = useCallback(
    async (text: string, files?: FileAttachment[]) => {
      let conversationId = useConversationStore.getState().conversationId
      if (!conversationId) {
        conversationId = crypto.randomUUID()
        useConversationStore.getState().setConversationId(conversationId)
      }

      // Generate a short title from user's first message
      if (useConversationStore.getState().messages.length === 0 && !useConversationStore.getState().currentTitle) {
        const shortTitle = text.length > 20 ? text.slice(0, 20) + '...' : text
        setTitle(shortTitle)
      }

      // Build API messages from current history BEFORE adding new pair
      const apiMessages = useConversationStore.getState().messages
        .filter((m) => !m.isStreaming)
        .map((m) => ({
          role: m.role,
          content: m.content,
          files: m.files || undefined,
        }))

      // Add current user message
      apiMessages.push({ role: 'user' as const, content: text, files: files || undefined })

      // Add user message to UI
      addMessage({
        id: crypto.randomUUID(),
        role: 'user',
        content: text,
        timestamp: Date.now(),
        files: files || undefined,
      })

      // Add streaming assistant placeholder to UI
      addMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        isStreaming: true,
      })

      setStreaming(true)

      const effectiveProjectDir = mode === 'project' ? projectDir : null

      try {
        await window.api.sendMessage({
          conversationId,
          messages: apiMessages,
          model,
          provider,
          projectDir: effectiveProjectDir,
          mode,
          activeSkillIds,
        })
      } catch (err) {
        console.error('Failed to send message:', err)
        setStreaming(false)
      }
    },
    [addMessage, setStreaming, setTitle, model, provider, projectDir, mode, activeSkillIds]
  )

  return { send }
}
