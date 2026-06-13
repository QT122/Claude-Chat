import type { ToolDefinition } from './base'
import { generateImage } from '../services/byteplus'

const FALLBACK_MODELS = ['doubao-seedream-4-5-251128', 'doubao-seedream-5-0-lite-260128']

export const generateImageTool: ToolDefinition = {
  name: 'generate_image',
  displayName: 'AI 生图',
  description:
    'Generate an AI image from a text prompt using BytePlus Seedream. Always translate the prompt to detailed English first. Use this when the user asks to create, generate, or draw an image.',
  inputSchema: {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description: 'Detailed English prompt describing the image to generate',
      },
    },
    required: ['prompt'],
  },

  async execute(input, context) {
    const prompt = (input.prompt as string)?.trim()
    if (!prompt) return { content: '请提供图片描述', isError: true }

    const key = context.byteplusApiKey
    if (!key) {
      return { content: '未配置 BytePlus API Key，请在设置中填入火山方舟 API Key 后重试。' }
    }

    try {
      const imageUrl = await generateImage(prompt, key)
      return {
        content: `![${prompt}](${imageUrl})\n\n> 提示词: ${prompt}\n> 模型: ${FALLBACK_MODELS[0]}`,
        metadata: { prompt },
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return {
        content: `生图失败: ${msg}。请检查 API Key 是否有效，或稍后重试。`,
        isError: true,
      }
    }
  },
}
