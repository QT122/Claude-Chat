import type { ToolDefinition } from './base'
import { generateVideo } from '../services/byteplus'

export const generateVideoTool: ToolDefinition = {
  name: 'generate_video',
  displayName: 'AI 生视频',
  description:
    'Generate an AI video from a text prompt using BytePlus Seedance. The prompt should describe what happens in the video. Use this when the user asks to create or generate a video.',
  inputSchema: {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description: 'Detailed English prompt describing the video scene, motion, and style',
      },
      reference_image_url: {
        type: 'string',
        description: 'Optional: reference image URL to base the video on (image-to-video)',
      },
    },
    required: ['prompt'],
  },

  async execute(input, context) {
    const prompt = (input.prompt as string)?.trim()
    if (!prompt) return { content: '请提供视频描述', isError: true }

    const key = context.byteplusApiKey
    if (!key) return { content: '未配置 BytePlus API Key，请在设置中填入火山方舟 API Key 后重试。' }

    // Note: reference_image_url is a future enhancement for image-to-video
    // For now, only text-to-video is fully supported

    try {
      const videoUrl = await generateVideo(prompt, key)
      return {
        content: `![视频预览](${videoUrl})\n\n[下载视频](${videoUrl})\n\n> 提示词: ${prompt}\n> 模型: doubao-seedance-2-0\n> ⚠️ 视频生成需要较长时间，请耐心等待`,
        metadata: { prompt },
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return {
        content: `生视频失败: ${msg}。视频生成需要较长时间，请检查 API Key 是否有效，或稍后重试。`,
        isError: true,
      }
    }
  },
}
