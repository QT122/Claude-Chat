import Anthropic from '@anthropic-ai/sdk'
import type { ProviderAdapter, StreamEvents, StreamParams, ChatMessage, FileAttachment } from './provider-types'

const MAX_TOOL_TURNS = 15

export const anthropicProvider: ProviderAdapter = {
  async stream(params: StreamParams, emit: StreamEvents): Promise<void> {
    const {
      conversationId,
      messages: initialMessages,
      systemPrompt,
      apiKey,
      model,
      maxTokens = 4096,
      onToolExecute,
      tools = [],
    } = params

    const anthropic = new Anthropic({ apiKey })

    // Convert tools to Anthropic format
    const anthropicTools: Anthropic.Tool[] = tools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: {
        type: t.input_schema.type,
        properties: t.input_schema.properties,
        required: t.input_schema.required,
      },
    }))

    function buildContentBlocks(msg: ChatMessage): Anthropic.MessageParam['content'] {
      if (msg.role === 'assistant') {
        return msg.content
      }

      const blocks: Anthropic.ContentBlockParam[] = []

      if (msg.files && msg.files.length > 0) {
        for (const file of msg.files) {
          if (file.isImage) {
            const mimeMap: Record<string, string> = {
              png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
              gif: 'image/gif', webp: 'image/webp', bmp: 'image/bmp',
            }
            const mime = mimeMap[file.type] || 'image/png'
            blocks.push({
              type: 'image',
              source: {
                type: 'base64',
                media_type: mime as 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp',
                data: file.content,
              },
            })
          } else {
            blocks.push({
              type: 'text',
              text: `[文件: ${file.name}]\n\`\`\`\n${file.content.slice(0, 8000)}\n\`\`\``,
            })
          }
        }
      }

      if (msg.content) {
        blocks.push({ type: 'text', text: msg.content })
      }

      return blocks
    }

    try {
      let currentMessages: Anthropic.MessageParam[] = initialMessages.map((m) => ({
        role: m.role,
        content: buildContentBlocks(m),
      }))
      let tokenIndex = 0

      for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
        const stream = anthropic.messages.stream({
          model,
          max_tokens: maxTokens,
          system: systemPrompt,
          messages: currentMessages,
          tools: anthropicTools.length > 0 ? anthropicTools : undefined,
        })

        const toolUseBlocks = new Map<number, { id: string; name: string; input: string }>()

        stream.on('text', (text) => {
          emit.token({ conversationId, token: text, index: tokenIndex++ })
        })

        stream.on('contentBlockStart', (block) => {
          if (block.content_block.type === 'tool_use') {
            const tb = block.content_block
            toolUseBlocks.set(block.index, { id: tb.id, name: tb.name, input: '' })
            emit.toolCall({
              conversationId,
              toolCall: { id: tb.id, name: tb.name, status: 'parsing', input: '' },
            })
          }
        })

        stream.on('contentBlockDelta', (delta) => {
          if (delta.delta.type === 'input_json_delta') {
            const block = toolUseBlocks.get(delta.index)
            if (block) {
              block.input += delta.delta.partial_json
              emit.toolCall({
                conversationId,
                toolCall: { id: block.id, name: block.name, status: 'parsing', input: block.input },
              })
            }
          }
        })

        const finalMessage = await stream.finalMessage()

        const toolUses = finalMessage.content.filter(
          (c): c is Anthropic.ToolUseBlock => c.type === 'tool_use'
        )

        if (toolUses.length === 0) {
          emit.done({ conversationId, stopReason: finalMessage.stop_reason || 'end_turn' })
          return
        }

        const toolResults: Anthropic.ToolResultBlockParam[] = []

        for (const toolUse of toolUses) {
          emit.toolCall({
            conversationId,
            toolCall: {
              id: toolUse.id,
              name: toolUse.name,
              status: 'running',
              input: JSON.stringify(toolUse.input),
            },
          })

          try {
            let result: { content: string; isError?: boolean }
            if (onToolExecute) {
              result = await onToolExecute(toolUse.name, toolUse.input as Record<string, unknown>)
            } else {
              result = { content: `工具 ${toolUse.name} 未实现`, isError: true }
            }

            emit.toolResult({
              conversationId,
              toolResult: { id: toolUse.id, status: 'done', content: result.content, isError: result.isError ?? false },
            })

            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: result.content,
              is_error: result.isError,
            })
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err)
            emit.toolResult({
              conversationId,
              toolResult: { id: toolUse.id, status: 'error', content: errorMsg, isError: true },
            })
            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: errorMsg,
              is_error: true,
            })
          }
        }

        currentMessages.push({ role: 'assistant', content: finalMessage.content })
        currentMessages.push({ role: 'user', content: toolResults })
      }

      emit.done({ conversationId, stopReason: 'max_tool_turns' })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      emit.error({ conversationId, error: message })
    }
  },
}
