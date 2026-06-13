import { safeStorage } from 'electron'
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'

const KEY_FILES: Record<string, string> = {
  anthropic: 'api-key.enc',
  deepseek: 'deepseek-key.enc',
  openai: 'openai-key.enc',
  byteplus: 'byteplus-key.enc',
}

function getKeyPath(provider: string): string {
  return join(app.getPath('userData'), KEY_FILES[provider] || `${provider}-key.enc`)
}

export function isEncryptionAvailable(): boolean {
  return safeStorage.isEncryptionAvailable()
}

export function storeApiKey(provider: string, apiKey: string): void {
  const encrypted = safeStorage.encryptString(apiKey)
  writeFileSync(getKeyPath(provider), encrypted)
}

export function getApiKey(provider: string): string | null {
  const keyPath = getKeyPath(provider)
  if (!existsSync(keyPath)) return null
  try {
    const buffer = readFileSync(keyPath)
    return safeStorage.decryptString(buffer)
  } catch {
    return null
  }
}

export function deleteApiKey(provider: string): void {
  const keyPath = getKeyPath(provider)
  if (existsSync(keyPath)) {
    unlinkSync(keyPath)
  }
}
