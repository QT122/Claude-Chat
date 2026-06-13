import type { ToolDefinition } from './base'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { dialog, BrowserWindow } from 'electron'

export const editFileTool: ToolDefinition = {
  name: 'edit_file',
  description: `编辑文件中的指定内容。通过查找并替换 exact 字符串来修改文件。
old_string 必须精确匹配文件中的内容（包括所有空白字符）。如果 old_string 在文件中不唯一，操作会失败。
重要：在调用此工具前，先向用户说明将要修改的内容，等待确认后再执行。`,
  displayName: '编辑文件',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: '相对于项目根目录的文件路径',
      },
      old_string: {
        type: 'string',
        description: '要替换的原文字（必须精确匹配）',
      },
      new_string: {
        type: 'string',
        description: '替换后的新文字',
      },
    },
    required: ['path', 'old_string', 'new_string'],
  },
  execute: async (input, context) => {
    const filePath = input.path as string | undefined
    const oldStr = input.old_string as string | undefined
    const newStr = input.new_string as string | undefined

    if (!filePath) return { content: '错误: 未指定文件路径。', isError: true }
    if (!oldStr && oldStr !== '') return { content: '错误: 未指定要替换的内容。', isError: true }

    if (!context.projectDir) {
      return { content: '错误: 未设置项目目录。', isError: true }
    }

    try {
      const resolved = resolve(context.projectDir, filePath)
      const normalizedRoot = resolve(context.projectDir)
      if (!resolved.startsWith(normalizedRoot)) {
        return { content: `路径越界: ${filePath}`, isError: true }
      }

      if (!existsSync(resolved)) {
        return { content: `文件不存在: ${filePath}`, isError: true }
      }

      const fileContent = readFileSync(resolved, 'utf-8')

      let count = 0
      let pos = 0
      while ((pos = fileContent.indexOf(oldStr, pos)) !== -1) {
        count++
        pos += oldStr.length
      }

      if (count === 0) {
        return { content: `未找到匹配的文本。请检查 old_string 是否与文件内容完全一致。`, isError: true }
      }
      if (count > 1) {
        return { content: `找到 ${count} 处匹配，无法唯一定位。请提供更多上下文使 old_string 唯一。`, isError: true }
      }

      // Confirmation dialog
      const win = BrowserWindow.getFocusedWindow()
      if (win) {
        const oldPreview = oldStr.length > 200 ? oldStr.slice(0, 200) + '...' : oldStr
        const newPreview = newStr.length > 200 ? newStr.slice(0, 200) + '...' : newStr
        const result = await dialog.showMessageBox(win, {
          type: 'question',
          title: '确认编辑文件',
          message: `修改: ${filePath}`,
          detail: `- 删除:\n${oldPreview}\n\n+ 添加:\n${newPreview}\n\n确认此修改?`,
          buttons: ['确认', '取消'],
          defaultId: 1,
          cancelId: 1,
        })
        if (result.response === 1) {
          return { content: `用户取消了编辑: ${filePath}`, isError: true }
        }
      }

      const newContent = fileContent.replace(oldStr, newStr)
      writeFileSync(resolved, newContent, 'utf-8')
      return { content: `文件已编辑: ${filePath}` }
    } catch (err) {
      return { content: `编辑文件失败: ${err}`, isError: true }
    }
  },
}
