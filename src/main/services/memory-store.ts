import { readFileSync, writeFileSync, readdirSync, unlinkSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'

export interface MemoryRecord {
  id: string
  title: string
  content: string
  type: 'user' | 'feedback' | 'project' | 'reference'
  conversationId?: string
  createdAt: number
  updatedAt: number
}

function getStoreDir(): string {
  const dir = join(app.getPath('userData'), 'memories')
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  return dir
}

function getMemoryPath(id: string): string {
  return join(getStoreDir(), `${id}.json`)
}

export function saveMemory(memory: MemoryRecord): void {
  const data = JSON.stringify(memory, null, 2)
  writeFileSync(getMemoryPath(memory.id), data, 'utf-8')
}

export function loadMemory(id: string): MemoryRecord | null {
  try {
    const data = readFileSync(getMemoryPath(id), 'utf-8')
    return JSON.parse(data)
  } catch {
    return null
  }
}

export function listMemories(): Array<{ id: string; title: string; content: string; type: string; createdAt: number; updatedAt: number }> {
  try {
    const dir = getStoreDir()
    const files = readdirSync(dir).filter((f) => f.endsWith('.json'))
    const memories: Array<{ id: string; title: string; content: string; type: string; createdAt: number; updatedAt: number }> = []

    for (const file of files) {
      try {
        const data = readFileSync(join(dir, file), 'utf-8')
        const mem = JSON.parse(data) as MemoryRecord
        memories.push({
          id: mem.id,
          title: mem.title || '未命名记忆',
          content: mem.content,
          type: mem.type,
          createdAt: mem.createdAt,
          updatedAt: mem.updatedAt,
        })
      } catch {
        // Skip corrupted files
      }
    }

    return memories.sort((a, b) => b.updatedAt - a.updatedAt)
  } catch {
    return []
  }
}

export function deleteMemory(id: string): boolean {
  try {
    const path = getMemoryPath(id)
    if (existsSync(path)) {
      unlinkSync(path)
    }
    return true
  } catch {
    return false
  }
}

export function deleteMemoriesByConversation(conversationId: string): void {
  const memories = listMemories()
  for (const mem of memories) {
    if (mem.conversationId === conversationId) {
      try {
        const path = getMemoryPath(mem.id)
        if (existsSync(path)) unlinkSync(path)
      } catch { /* skip */ }
    }
  }
}
