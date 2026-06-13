import { ipcMain, BrowserWindow, app } from 'electron'
import { getApiKey } from '../util/encryption'
import { anthropicProvider } from '../services/anthropic-provider'
import { deepseekProvider } from '../services/deepseek-provider'
import type { ProviderAdapter, ProviderType } from '../services/provider-types'
import type { ToolContext } from '../tools/base'
import { getToolRegistry } from '../tools'
import { loadSkill } from '../services/skills-store'
import { addMediaRecord, getMediaDataUrl } from '../services/media-store'
import { listMemories } from '../services/memory-store'
import { join } from 'path'
import { existsSync, readFileSync, unlinkSync } from 'fs'
import { randomUUID } from 'crypto'

interface ChatSendData {
  conversationId: string
  messages: Array<{ role: 'user' | 'assistant'; content: string; files?: Array<{ id: string; name: string; type: string; size: number; content: string; isImage: boolean }> }>
  systemPrompt?: string
  model?: string
  provider?: ProviderType
  projectDir?: string | null
  mode?: 'chat' | 'project'
  activeSkillIds?: string[]
}

const activeStreams = new Map<string, AbortController>()

const providers: Record<ProviderType, ProviderAdapter> = {
  anthropic: anthropicProvider,
  deepseek: deepseekProvider,
}

function getDefaultSystemPrompt(provider: ProviderType, projectDir?: string | null, mode?: string, activeSkillIds?: string[]): string {
  let prompt = ''
  if (provider === 'deepseek') {
    prompt = 'You are Claude, a helpful AI assistant created by Anthropic.'
  } else {
    prompt = 'You are Claude, a helpful AI assistant.'
  }

  if (mode === 'project') {
    prompt += `\n\nYou have access to tools that can read files, list directories, and search content in the user's project.`
    if (projectDir) {
      prompt += `\nThe user's project directory is: ${projectDir}. Use tools with paths relative to this directory.`
    }
    prompt += `\nWhen responding:
- Use Markdown formatting for readability
- Use code blocks with language identifiers for code
- Be concise and direct
- If you need to see the user's files, use the available tools`
  } else {
    prompt += `\nWhen responding:
- Use Markdown formatting for readability
- Use code blocks with language identifiers for code
- Be concise and direct`
  }

  // Always include memory tool info
  prompt += `\n\nYou have access to a save_memory tool. Use it AGGRESSIVELY and PROACTIVELY. Do NOT wait for the user to tell you to remember.

Save a memory IMMEDIATELY when you detect ANY of these:
- The user's name, role, school, workplace, location, or personal background (type: "user")
- The user's preferences: answer format, language, tone, code style (type: "user")
- Current tasks, assignments, projects, deadlines, bugs they're working on (type: "project")
- External tools, websites, APIs, file paths, or resources mentioned (type: "reference")
- Any fact that would help you help the user better in future conversations

RULES:
- Save DURING the conversation, not at the end. Save each fact as you learn it.
- One specific fact per memory with a clear title and detailed content.
- If the user corrects you or gives feedback, save it.
- Better to save too much than too little.`

  // Web tools
  prompt += `\n\nWeb tools:
- web_search: Search the web. Use for current info or facts beyond your knowledge.
- web_fetch: Fetch and extract text from a web page.
- web_images: Search for images. Returns direct image URLs displayed inline.
Proactively use web_search when you need current information. Always cite sources.

Document generation tools (all prompt the user with a save dialog):
- create_document: Generate a .docx Word document with title and markdown-formatted content (# headings, - bullets, | tables).
- create_presentation: Generate a .pptx PowerPoint with title and array of slides (each with title and bullet content).
- create_spreadsheet: Generate an .xlsx Excel spreadsheet with headers and data rows.
When the user asks for a report, summary, presentation, slides, table, spreadsheet, or any structured document, proactively use these tools to generate a downloadable file.

Media generation tools:
- generate_image: Generate an AI image from a text prompt. Use detailed English prompts. Use this when the user asks you to create, draw, or generate an image.
- generate_video: Generate an AI video from a text prompt. Videos take 30-60 seconds to generate. Use this when the user wants to create a video or animation.
When the user asks for an image, picture, drawing, video, or animation, use these tools.
CRITICAL: When a media generation tool returns a markdown image like ![description](url), you MUST include that exact markdown image tag in your response. Do not just say "the image was generated". Show the image to the user by including the markdown tag the tool gave you.`

  if (activeSkillIds && activeSkillIds.length > 0) {
    const skillPrompts: string[] = []
    for (const skillId of activeSkillIds) {
      const skill = loadSkill(skillId)
      if (skill) {
        skillPrompts.push(`## ${skill.name}\n${skill.systemPrompt}`)
      }
    }
    if (skillPrompts.length > 0) {
      prompt += `\n\nThe following specialized skills are active. Apply their instructions when relevant:\n${skillPrompts.join('\n\n')}`
    }
  }

  // Include saved memories in system prompt
  try {
    const memories = listMemories()
    if (memories.length > 0) {
      const memoryText = memories
        .map((m) => `- [${m.type}] ${m.title}: ${m.content}`)
        .join('\n')
      prompt += `\n\n## 用户记忆 (User Memories)\n以下是你之前记录下来的关于用户的信息。请在对话中参考这些信息:\n${memoryText}`
    }
  } catch { /* ignore */ }

  return prompt
}

export function registerChatHandlers(): void {
  ipcMain.handle('chat:send', async (event, data: ChatSendData) => {
    const provider = data.provider || 'anthropic'
    const apiKey = getApiKey(provider)
    if (!apiKey) {
      return { success: false, error: `未配置 ${provider === 'deepseek' ? 'DeepSeek' : 'Anthropic'} API Key，请在设置中输入` }
    }

    const byteplusApiKey = getApiKey('byteplus') || undefined

    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) {
      return { success: false, error: '无法获取窗口' }
    }

    const abortController = new AbortController()
    activeStreams.set(data.conversationId, abortController)

    const systemPrompt = data.systemPrompt || getDefaultSystemPrompt(provider, data.projectDir, data.mode, data.activeSkillIds)
    const adapter = providers[provider]

    const registry = getToolRegistry()
    const toolDefs = registry.getAll().map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.inputSchema,
    }))

    // Chat mode tools: memory, web, media generation, documents
    const chatModeTools = [
      'save_memory', 'web_search', 'web_fetch', 'web_images',
      'create_document', 'create_presentation', 'create_spreadsheet',
      'generate_image', 'generate_video',
    ]
    // In chat mode, give chat tools; in project mode, give all tools
    const availableTools = data.mode === 'project'
      ? toolDefs
      : toolDefs.filter((t) => chatModeTools.includes(t.name))

    adapter.stream(
      {
        conversationId: data.conversationId,
        messages: data.messages,
        systemPrompt,
        apiKey,
        model: data.model || (provider === 'deepseek' ? 'deepseek-v4-pro' : 'claude-sonnet-4-20250514'),
        maxTokens: 4096,
        projectDir: data.projectDir,
        byteplusApiKey,
        tools: availableTools,
        onToolExecute: async (name: string, input: Record<string, unknown>) => {
          const context: ToolContext = {
            projectDir: data.projectDir || null,
            conversationId: data.conversationId,
            byteplusApiKey,
          }
          const result = await registry.execute(name, input, context)

          // Inject media generation results directly into chat stream
          const mediaTools = ['generate_image', 'generate_video']
          if (mediaTools.includes(name) && !result.isError && result.content) {
            const localImgMatch = result.content.match(/local-img:\/\/\.\/([^\s)]+)/)
            if (localImgMatch) {
              const filename = localImgMatch[1]
              const dataUrl = getMediaDataUrl(filename)
              const mediaType = name === 'generate_video' ? 'video' : 'image'
              const prompt = (input.prompt as string) || ''

              if (dataUrl) {
                // Save metadata
                addMediaRecord({
                  id: randomUUID(),
                  filename,
                  prompt,
                  type: mediaType,
                  createdAt: Date.now(),
                  downloaded: false,
                })

                // Send media to renderer
                win.webContents.send('chat:media', {
                  conversationId: data.conversationId,
                  media: {
                    id: randomUUID(),
                    filename,
                    prompt,
                    type: mediaType,
                    dataUrl,
                    createdAt: Date.now(),
                    downloaded: false,
                  },
                })
              }
            }
          }

          return result
        },
      },
      {
        token: (d) => win.webContents.send('chat:token', d),
        toolCall: (d) => win.webContents.send('chat:tool-call', d),
        toolResult: (d) => win.webContents.send('chat:tool-result', d),
        done: (d) => {
          win.webContents.send('chat:done', d)
          activeStreams.delete(data.conversationId)
        },
        error: (d) => {
          win.webContents.send('chat:error', d)
          activeStreams.delete(data.conversationId)
        },
      }
    ).catch(() => {
      activeStreams.delete(data.conversationId)
    })

    return { success: true, conversationId: data.conversationId }
  })

  ipcMain.handle('chat:abort', async (_event, conversationId: string) => {
    const controller = activeStreams.get(conversationId)
    if (controller) {
      controller.abort()
      activeStreams.delete(conversationId)
    }
    return { success: true }
  })
}
