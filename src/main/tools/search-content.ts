import { readFileSync, existsSync, statSync } from 'fs'
import { resolve, extname } from 'path'
import type { ToolDefinition } from './base'

const MAX_FILE_SIZE = 200 * 1024 // 200KB per file
const MAX_RESULTS = 50
const TEXT_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.txt', '.css', '.html',
  '.py', '.rs', '.go', '.java', '.c', '.cpp', '.h', '.hpp', '.yaml', '.yml',
  '.toml', '.xml', '.svg', '.sql', '.sh', '.bash', '.zsh', '.env', '.gitignore',
])

function validatePath(requestedPath: string, projectRoot: string): string {
  const resolved = resolve(projectRoot, requestedPath)
  const normalizedRoot = resolve(projectRoot)
  if (!resolved.startsWith(normalizedRoot)) {
    throw new Error(`路径越界: ${requestedPath}`)
  }
  return resolved
}

function walkDir(dirPath: string): string[] {
  const files: string[] = []
  const fs = require('fs')
  const path = require('path')
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })

  for (const entry of entries) {
    // Skip hidden dirs and node_modules
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      files.push(...walkDir(fullPath))
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase()
      if (TEXT_EXTENSIONS.has(ext) || ext === '') {
        try {
          if (statSync(fullPath).size <= MAX_FILE_SIZE) {
            files.push(fullPath)
          }
        } catch { /* skip */ }
      }
    }
  }
  return files
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export const searchContentTool: ToolDefinition = {
  name: 'search_content',
  displayName: '搜索内容',
  description: 'Search for a text pattern in project files. Returns matching file paths and line content.',
  inputSchema: {
    type: 'object',
    properties: {
      pattern: {
        type: 'string',
        description: 'Text or regex pattern to search for in files',
      },
      path: {
        type: 'string',
        description: 'Subdirectory within the project to search in. Use "." for the entire project.',
      },
    },
    required: ['pattern'],
  },

  async execute(input, context) {
    if (!context.projectDir) {
      return { content: '未设置项目目录', isError: true }
    }

    try {
      const searchPath = validatePath((input.path as string) || '.', context.projectDir)
      const pattern = input.pattern as string

      if (!existsSync(searchPath)) {
        return { content: `路径不存在: ${input.path}`, isError: true }
      }

      let regex: RegExp
      try {
        regex = new RegExp(escapeRegex(pattern), 'gi')
      } catch {
        return { content: `无效的正则表达式: ${pattern}`, isError: true }
      }

      const files = statSync(searchPath).isDirectory()
        ? walkDir(searchPath)
        : (TEXT_EXTENSIONS.has(extname(searchPath)) ? [searchPath] : [])

      const results: string[] = []
      let matchCount = 0

      for (const filePath of files) {
        if (matchCount >= MAX_RESULTS) break
        try {
          const content = readFileSync(filePath, 'utf-8')
          const lines = content.split('\n')
          const relPath = filePath.replace(context.projectDir!, '').replace(/^[\\/]/, '')

          for (let i = 0; i < lines.length; i++) {
            if (matchCount >= MAX_RESULTS) break
            if (regex.test(lines[i])) {
              // Reset lastIndex since we used test()
              regex.lastIndex = 0
              results.push(`${relPath}:${i + 1}: ${lines[i].trim().slice(0, 200)}`)
              matchCount++
            }
          }
        } catch { /* skip unreadable files */ }
      }

      if (results.length === 0) {
        return { content: `未找到匹配 "${pattern}" 的内容` }
      }

      if (matchCount >= MAX_RESULTS) {
        results.push(`\n(结果已截断，仅显示前 ${MAX_RESULTS} 条匹配)`)
      }

      return {
        content: results.join('\n'),
        metadata: { pattern, matchCount },
      }
    } catch (err) {
      return { content: `搜索出错: ${err instanceof Error ? err.message : String(err)}`, isError: true }
    }
  },
}
