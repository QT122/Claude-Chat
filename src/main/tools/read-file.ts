import { readFileSync, existsSync, statSync } from 'fs'
import { resolve } from 'path'
import type { ToolDefinition } from './base'

const MAX_FILE_SIZE = 500 * 1024 // 500KB

function validatePath(requestedPath: string, projectRoot: string): string {
  const resolved = resolve(projectRoot, requestedPath)
  const normalizedRoot = resolve(projectRoot)
  if (!resolved.startsWith(normalizedRoot)) {
    throw new Error(`路径越界: ${requestedPath}`)
  }
  return resolved
}

export const readFileTool: ToolDefinition = {
  name: 'read_file',
  displayName: '读取文件',
  description: 'Read the contents of a file in the project directory. Returns the file text content.',
  inputSchema: {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: 'Path to the file relative to the project root',
      },
    },
    required: ['file_path'],
  },

  async execute(input, context) {
    if (!context.projectDir) {
      return { content: '未设置项目目录', isError: true }
    }

    try {
      const filePath = validatePath(input.file_path as string, context.projectDir)

      if (!existsSync(filePath)) {
        return { content: `文件不存在: ${input.file_path}`, isError: true }
      }

      const stat = statSync(filePath)
      if (stat.isDirectory()) {
        return { content: `路径是目录而非文件: ${input.file_path}`, isError: true }
      }
      if (stat.size > MAX_FILE_SIZE) {
        return { content: `文件过大 (${(stat.size / 1024).toFixed(1)}KB > ${MAX_FILE_SIZE / 1024}KB)`, isError: true }
      }

      const content = readFileSync(filePath, 'utf-8')
      return {
        content,
        metadata: { filePath, size: stat.size },
      }
    } catch (err) {
      return { content: `读取文件出错: ${err instanceof Error ? err.message : String(err)}`, isError: true }
    }
  },
}
