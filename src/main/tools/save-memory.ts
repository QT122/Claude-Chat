import type { ToolDefinition } from './base'
import { saveMemory } from '../services/memory-store'

export const saveMemoryTool: ToolDefinition = {
  name: 'save_memory',
  description: '保存重要的信息到记忆系统。当你了解到用户的关键信息、偏好、项目背景等重要内容时，主动调用此工具自动记录。记忆类型：user(用户信息), feedback(反馈记录), project(项目信息), reference(参考资料)。',
  displayName: '保存记忆',
  inputSchema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: '记忆的简短标题',
      },
      content: {
        type: 'string',
        description: '记忆的详细内容',
      },
      type: {
        type: 'string',
        enum: ['user', 'feedback', 'project', 'reference'],
        description: '记忆类型',
      },
    },
    required: ['title', 'content', 'type'],
  },
  execute: async (input, context) => {
    const title = input.title as string
    const content = input.content as string
    const type = (input.type as string) || 'user'

    const memory = {
      id: crypto.randomUUID(),
      title,
      content,
      type: type as 'user' | 'feedback' | 'project' | 'reference',
      conversationId: context.conversationId || undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    try {
      saveMemory(memory)
      return {
        content: `记忆已保存: "${title}"`,
        metadata: { memory },
      }
    } catch (err) {
      return {
        content: `保存记忆失败: ${err}`,
        isError: true,
      }
    }
  },
}
