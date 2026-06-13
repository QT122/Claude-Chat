import type { ToolDefinition } from './base'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { dirname, resolve } from 'path'
import { dialog, BrowserWindow } from 'electron'

export const writeFileTool: ToolDefinition = {
  name: 'write_file',
  description: `写入或创建文件。会自动创建所需的父目录。
重要：在调用此工具前，先向用户展示文件路径和内容摘要，等待确认后再执行。
如果需要用户确认，先回复说明将要进行的修改，等用户同意后再调用此工具。`,
  displayName: '写入文件',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: '相对于项目根目录的文件路径',
      },
      content: {
        type: 'string',
        description: '要写入的文件内容',
      },
    },
    required: ['path', 'content'],
  },
  execute: async (input, context) => {
    const filePath = input.path as string | undefined
    const content = input.content as string | undefined

    if (!filePath) return { content: '错误: 未指定文件路径。', isError: true }
    if (!content && content !== '') return { content: '错误: 未指定文件内容。', isError: true }

    if (!context.projectDir) {
      return { content: '错误: 未设置项目目录。', isError: true }
    }

    try {
      const resolved = resolve(context.projectDir, filePath)
      const normalizedRoot = resolve(context.projectDir)
      if (!resolved.startsWith(normalizedRoot)) {
        return { content: `路径越界: ${filePath}`, isError: true }
      }

      // Confirmation dialog
      const win = BrowserWindow.getFocusedWindow()
      if (win) {
        const preview = content.length > 500 ? content.slice(0, 500) + '...' : content
        const action = existsSync(resolved) ? '覆盖' : '创建'
        const result = await dialog.showMessageBox(win, {
          type: 'question',
          title: '确认写入文件',
          message: `${action}文件: ${filePath}`,
          detail: `内容预览:\n\n${preview}\n\n确认${action}此文件?`,
          buttons: ['确认', '取消'],
          defaultId: 1,
          cancelId: 1,
        })
        if (result.response === 1) {
          return { content: `用户取消了写入: ${filePath}`, isError: true }
        }
      }

      const dir = dirname(resolved)
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }

      writeFileSync(resolved, content, 'utf-8')
      return { content: `文件已写入: ${filePath} (${content.length} 字符)` }
    } catch (err) {
      return { content: `写入文件失败: ${err}`, isError: true }
    }
  },
}
