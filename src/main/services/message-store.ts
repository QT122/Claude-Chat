import { readFileSync, writeFileSync, readdirSync, unlinkSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'
import type { Conversation } from '../../renderer/types/message'

function getStoreDir(): string {
  const dir = join(app.getPath('userData'), 'conversations')
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  return dir
}

function getConvPath(id: string): string {
  return join(getStoreDir(), `${id}.json`)
}

export function saveConversation(conversation: Conversation): void {
  const data = JSON.stringify(conversation, null, 2)
  writeFileSync(getConvPath(conversation.id), data, 'utf-8')
}

export function loadConversation(id: string): Conversation | null {
  try {
    const data = readFileSync(getConvPath(id), 'utf-8')
    return JSON.parse(data)
  } catch {
    return null
  }
}

export function listConversations(): Array<{ id: string; title: string; createdAt: number; updatedAt: number; mode?: string }> {
  try {
    const dir = getStoreDir()
    const files = readdirSync(dir).filter((f) => f.endsWith('.json'))
    const convos: Array<{ id: string; title: string; createdAt: number; updatedAt: number; mode?: string }> = []

    for (const file of files) {
      try {
        const data = readFileSync(join(dir, file), 'utf-8')
        const conv = JSON.parse(data) as Conversation
        convos.push({
          id: conv.id,
          title: conv.title || '新对话',
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
          mode: conv.mode || 'chat',
        })
      } catch {
        // Skip corrupted files
      }
    }

    return convos.sort((a, b) => b.updatedAt - a.updatedAt)
  } catch {
    return []
  }
}

export function deleteConversation(id: string): boolean {
  try {
    const path = getConvPath(id)
    if (existsSync(path)) {
      unlinkSync(path)
    }
    return true
  } catch {
    return false
  }
}
