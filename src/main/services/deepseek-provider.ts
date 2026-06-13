import OpenAI from 'openai'
import type { ProviderAdapter, StreamEvents, StreamParams, ChatMessage } from './provider-types'
import { describeImages } from './byteplus'

const MAX_TOOL_TURNS = 15

async function buildContent(m: ChatMessage, byteplusApiKey?: string): Promise<string> {
  const parts: string[] = []

  if (m.files && m.files.length > 0) {
    const images = m.files.filter((f) => f.isImage)
    const nonImages = m.files.filter((f) => !f.isImage)

    // Use BytePlus Vision API to describe images if key is available
    if (images.length > 0 && byteplusApiKey) {
      try {
        const imageList = images.map((img) => {
          const ext = img.type || 'png'
          const mimeMap: Record<string, string> = {
            png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
            gif: 'image/gif', webp: 'image/webp', bmp: 'image/bmp',
          }
          return { name: img.name, mime: mimeMap[ext] || 'image/png', data: img.content }
        })
        const description = await describeImages(imageList, byteplusApiKey)
        if (description) {
          parts.push(`[用户上传了图片，图片内容描述如下]\n${description}`)
        }
      } catch (err) {
        // Fallback: pass through placeholder
        parts.push(images.map((f) => `[图片: ${f.name}]`).join('\n'))
      }
    } else if (images.length > 0) {
      parts.push(images.map((f) => `[图片: ${f.name}]`).join('\n'))
    }

    // Non-image files: include their content
    for (const f of nonImages) {
      parts.push(`[文件: ${f.name}]\n\`\`\`\n${f.content.slice(0, 8000)}\n\`\`\``)
    }
  }

  if (m.content) {
    parts.push(m.content)
  }

  return parts.join('\n\n')
}

export const deepseekProvider: ProviderAdapter = {
  async stream(params: StreamParams, emit: StreamEvents): Promise<void> {
    const {
      conversationId,
      messages: initialMessages,
      systemPrompt,
      apiKey,
      model,
      maxTokens = 4096,
      byteplusApiKey,
      onToolExecute,
      tools = [],
    } = params

    const client = new OpenAI({
      apiKey,
      baseURL: 'https://api.deepseek.com/v1',
    })

    // Convert messages to OpenAI format, preprocessing images via BytePlus Vision
    let currentMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = []
    for (const m of initialMessages) {
      const content = await buildContent(m, byteplusApiKey)
      currentMessages.push({
        role: m.role as 'user' | 'assistant',
        content,
      })
    }

    let tokenIndex = 0

    // Convert our tools to OpenAI function format
    const openaiTools = tools.map((t) => ({
      type: 'function' as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.input_schema,
      },
    }))

    try {
      for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
        const stream = await client.chat.completions.create({
          model,
          max_tokens: maxTokens,
          messages: systemPrompt
            ? [{ role: 'system' as const, content: systemPrompt }, ...currentMessages]
            : currentMessages,
          stream: true,
          ...(openaiTools.length > 0 ? { tools: openaiTools, tool_choice: 'auto' as const } : {}),
        })

        let content = ''
        let toolCalls: Map<number, { id: string; name: string; arguments: string }> = new Map()

        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta

          if (delta?.content) {
            content += delta.content
            emit.token({ conversationId, token: delta.content, index: tokenIndex++ })
          }

          if (delta?.tool_calls) {
            for (const tc of delta.tool_calls) {
              const idx = tc.index
              if (!toolCalls.has(idx)) {
                toolCalls.set(idx, {
                  id: tc.id || crypto.randomUUID(),
                  name: tc.function?.name || 'unknown',
                  arguments: '',
                })
                emit.toolCall({
                  conversationId,
                  toolCall: {
                    id: toolCalls.get(idx)!.id,
                    name: toolCalls.get(idx)!.name,
                    status: 'parsing',
                    input: '',
                  },
                })
              }
              if (tc.function?.arguments) {
                const entry = toolCalls.get(idx)!
                entry.arguments += tc.function.arguments
                emit.toolCall({
                  conversationId,
                  toolCall: {
                    id: entry.id,
                    name: entry.name,
                    status: 'parsing',
                    input: entry.arguments,
                  },
                })
              }
            }
          }
        }

        // No tool calls — pure text response
        if (toolCalls.size === 0) {
          emit.done({ conversationId, stopReason: 'stop' })
          return
        }

        // Execute tools
        const toolResults: Array<{ role: 'tool'; tool_call_id: string; content: string }> = []
        currentMessages.push({
          role: 'assistant',
          content: content || '',
          tool_calls: Array.from(toolCalls.values()).map((tc) => ({
            id: tc.id,
            type: 'function' as const,
            function: { name: tc.name, arguments: tc.arguments },
          })),
        } as any)

        for (const [, tc] of toolCalls) {
          let parsedArgs: Record<string, unknown> = {}
          try {
            parsedArgs = JSON.parse(tc.arguments)
          } catch { /* ignore */ }

          emit.toolCall({
            conversationId,
            toolCall: { id: tc.id, name: tc.name, status: 'running', input: tc.arguments },
          })

          try {
            let result: { content: string; isError?: boolean }
            if (onToolExecute) {
              result = await onToolExecute(tc.name, parsedArgs)
            } else {
              result = { content: `工具 ${tc.name} 未实现`, isError: true }
            }

            emit.toolResult({
              conversationId,
              toolResult: { id: tc.id, status: 'done', content: result.content, isError: result.isError ?? false },
            })

            toolResults.push({ role: 'tool', tool_call_id: tc.id, content: result.content })
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err)
            emit.toolResult({
              conversationId,
              toolResult: { id: tc.id, status: 'error', content: errorMsg, isError: true },
            })
            toolResults.push({ role: 'tool', tool_call_id: tc.id, content: errorMsg })
          }
        }

        // Push tool results and continue loop
        currentMessages.push(...toolResults as any)
      }

      emit.done({ conversationId, stopReason: 'max_tool_turns' })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      emit.error({ conversationId, error: message })
    }
  },
}
