import { join } from 'path'
import { app } from 'electron'
import { existsSync, readFileSync, writeFileSync, unlinkSync, mkdirSync } from 'fs'

export interface MediaRecord {
  id: string
  filename: string
  prompt: string
  type: 'image' | 'video'
  createdAt: number
  downloaded: boolean
}

function getMediaDir(): string {
  const dir = join(app.getPath('userData'), 'generated')
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  return dir
}

function getStorePath(): string {
  return join(getMediaDir(), 'media.json')
}

export function loadMediaRecords(): MediaRecord[] {
  const storePath = getStorePath()
  if (!existsSync(storePath)) return []
  try {
    return JSON.parse(readFileSync(storePath, 'utf-8'))
  } catch {
    return []
  }
}

function saveMediaRecords(records: MediaRecord[]): void {
  writeFileSync(getStorePath(), JSON.stringify(records, null, 2))
}

export function addMediaRecord(record: MediaRecord): void {
  const records = loadMediaRecords()
  records.unshift(record)
  saveMediaRecords(records)
}

export function markDownloaded(filename: string): void {
  const records = loadMediaRecords()
  const record = records.find((r) => r.filename === filename)
  if (record) {
    record.downloaded = true
    saveMediaRecords(records)
  }
}

export function deleteMedia(filename: string): boolean {
  const filePath = join(getMediaDir(), filename)
  try {
    if (existsSync(filePath)) unlinkSync(filePath)
    const records = loadMediaRecords().filter((r) => r.filename !== filename)
    saveMediaRecords(records)
    return true
  } catch {
    return false
  }
}

export function getMediaDataUrl(filename: string): string | null {
  const filePath = join(getMediaDir(), filename)
  if (!existsSync(filePath)) return null
  try {
    const buffer = readFileSync(filePath)
    const ext = filename.split('.').pop()?.toLowerCase() || 'png'
    const mime = ext === 'mp4' ? 'video/mp4' : `image/${ext}`
    return `data:${mime};base64,${buffer.toString('base64')}`
  } catch {
    return null
  }
}

export function cleanupExpiredMedia(): void {
  const records = loadMediaRecords()
  const THREE_DAYS = 3 * 24 * 60 * 60 * 1000
  const now = Date.now()
  const kept: MediaRecord[] = []

  for (const record of records) {
    if (record.downloaded) {
      kept.push(record)
      continue
    }
    if (now - record.createdAt > THREE_DAYS) {
      const filePath = join(getMediaDir(), record.filename)
      try { if (existsSync(filePath)) unlinkSync(filePath) } catch { /* ignore */ }
    } else {
      kept.push(record)
    }
  }

  saveMediaRecords(kept)
}
