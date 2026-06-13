import { readdirSync, statSync, existsSync } from 'fs'
import { resolve, join } from 'path'
import type { ToolDefinition } from './base'

function validatePath(requestedPath: string, projectRoot: string): string {
  const resolved = resolve(projectRoot, requestedPath)
  const normalizedRoot = resolve(projectRoot)
  if (!resolved.startsWith(normalizedRoot)) {
    throw new Error(`路径越界: ${requestedPath}`)
  }
  return resolved
}

export const listDirectoryTool: ToolDefinition = {
  name: 'list_directory',
  displayName: '列出目录',
  description: 'List files and directories in a given project directory path.',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Directory path relative to the project root. Use "." for the project root.',
      },
    },
    required: ['path'],
  },

  async execute(input, context) {
    if (!context.projectDir) {
      return { content: '未设置项目目录', isError: true }
    }

    try {
      const dirPath = validatePath((input.path as string) || '.', context.projectDir)

      if (!existsSync(dirPath)) {
        return { content: `目录不存在: ${input.path}`, isError: true }
      }

      const st = statSync(dirPath)
      if (!st.isDirectory()) {
        return { content: `路径不是目录: ${input.path}`, isError: true }
      }

      const entries = readdirSync(dirPath, { withFileTypes: true })
      const lines: string[] = []

      // Sort: directories first, then files, alphabetically
      const sorted = [...entries].sort((a, b) => {
        if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1
        return a.name.localeCompare(b.name)
      })

      for (const entry of sorted) {
        const fullPath = join(dirPath, entry.name)
        let size = ''
        try {
          const entryStat = statSync(fullPath)
          if (entryStat.isFile()) {
            const kb = entryStat.size / 1024
            size = kb < 1 ? ` (${entryStat.size}B)` : ` (${kb.toFixed(1)}KB)`
          }
        } catch { /* ignore */ }

        const icon = entry.isDirectory() ? '📁' : '📄'
        lines.push(`${icon} ${entry.name}${size}`)
      }

      if (lines.length === 0) {
        return { content: '(空目录)', metadata: { dirPath } }
      }

      return {
        content: lines.join('\n'),
        metadata: { dirPath, count: lines.length },
      }
    } catch (err) {
      return { content: `列出目录出错: ${err instanceof Error ? err.message : String(err)}`, isError: true }
    }
  },
}
