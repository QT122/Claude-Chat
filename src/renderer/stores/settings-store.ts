import { create } from 'zustand'
import type { ProviderType } from '../../preload/index'

interface SettingsState {
  provider: ProviderType
  apiKeyConfigured: boolean
  apiKeyValid: boolean | null
  deepseekConfigured: boolean
  deepseekValid: boolean | null
  openaiConfigured: boolean
  openaiValid: boolean | null
  byteplusConfigured: boolean
  byteplusValid: boolean | null
  byteplusError: string | null
  projectDir: string | null
  model: string

  checkApiKey: (key: string) => Promise<void>
  setApiKey: (key: string) => Promise<void>
  clearApiKey: () => Promise<void>
  checkDeepseekKey: (key: string) => Promise<void>
  setDeepseekKey: (key: string) => Promise<void>
  clearDeepseekKey: () => Promise<void>
  checkOpenAIKey: (key: string) => Promise<void>
  setOpenAIKey: (key: string) => Promise<void>
  clearOpenAIKey: () => Promise<void>
  checkByteplusKey: (key: string) => Promise<void>
  setByteplusKey: (key: string) => Promise<void>
  clearByteplusKey: () => Promise<void>
  setProvider: (provider: ProviderType) => void
  setProjectDir: (dir: string | null) => void
  setModel: (model: string) => void
  loadSettings: () => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  provider: 'deepseek',
  apiKeyConfigured: false,
  apiKeyValid: null,
  deepseekConfigured: false,
  deepseekValid: null,
  openaiConfigured: false,
  openaiValid: null,
  byteplusConfigured: false,
  byteplusValid: null,
  byteplusError: null,
  projectDir: null,
  model: 'deepseek-v4-pro',

  checkApiKey: async (key: string) => {
    try {
      const result = await window.api.testApiKey('anthropic', key)
      set({ apiKeyValid: result.valid })
    } catch {
      set({ apiKeyValid: false })
    }
  },

  setApiKey: async (key: string) => {
    try {
      const result = await window.api.setApiKey('anthropic', key)
      if (result.success) {
        set({ apiKeyConfigured: true, apiKeyValid: true })
      }
    } catch { /* ignore */ }
  },

  clearApiKey: async () => {
    await window.api.deleteApiKey('anthropic')
    set({ apiKeyConfigured: false, apiKeyValid: null })
  },

  checkDeepseekKey: async (key: string) => {
    try {
      const result = await window.api.testApiKey('deepseek', key)
      set({ deepseekValid: result.valid })
    } catch {
      set({ deepseekValid: false })
    }
  },

  setDeepseekKey: async (key: string) => {
    try {
      const result = await window.api.setApiKey('deepseek', key)
      if (result.success) {
        set({ deepseekConfigured: true, deepseekValid: true })
      }
    } catch { /* ignore */ }
  },

  clearDeepseekKey: async () => {
    await window.api.deleteApiKey('deepseek')
    set({ deepseekConfigured: false, deepseekValid: null })
  },

  checkOpenAIKey: async (key: string) => {
    try {
      const result = await window.api.testApiKey('openai', key)
      set({ openaiValid: result.valid })
    } catch {
      set({ openaiValid: false })
    }
  },

  setOpenAIKey: async (key: string) => {
    try {
      const result = await window.api.setApiKey('openai', key)
      if (result.success) {
        set({ openaiConfigured: true, openaiValid: true })
      }
    } catch { /* ignore */ }
  },

  clearOpenAIKey: async () => {
    await window.api.deleteApiKey('openai')
    set({ openaiConfigured: false, openaiValid: null })
  },

  checkByteplusKey: async (key: string) => {
    try {
      const result = await window.api.testApiKey('byteplus', key)
      set({ byteplusValid: result.valid, byteplusError: result.valid ? null : (result.error || '未知错误') })
    } catch {
      set({ byteplusValid: false, byteplusError: '连接测试失败，请检查网络' })
    }
  },

  setByteplusKey: async (key: string) => {
    try {
      const result = await window.api.setApiKey('byteplus', key)
      if (result.success) {
        set({ byteplusConfigured: true, byteplusValid: true })
      }
    } catch { /* ignore */ }
  },

  clearByteplusKey: async () => {
    await window.api.deleteApiKey('byteplus')
    set({ byteplusConfigured: false, byteplusValid: null, byteplusError: null })
  },

  setProvider: (provider) => {
    set({ provider })
    if (provider === 'deepseek') {
      set({ model: 'deepseek-v4-pro' })
    } else {
      set({ model: 'claude-sonnet-4-20250514' })
    }
  },

  setProjectDir: (dir) => {
    set({ projectDir: dir })
    if (dir) {
      window.api.setSetting('lastProjectDir', dir)
    }
  },
  setModel: (model) => set({ model }),

  loadSettings: async () => {
    try {
      const [anthropicResult, deepseekResult, openaiResult, byteplusResult, lastDirResult] = await Promise.all([
        window.api.getApiKey('anthropic'),
        window.api.getApiKey('deepseek'),
        window.api.getApiKey('openai'),
        window.api.getApiKey('byteplus'),
        window.api.getSetting('lastProjectDir'),
      ])
      const lastDir = lastDirResult.value as string | null
      set({
        apiKeyConfigured: anthropicResult.configured,
        deepseekConfigured: deepseekResult.configured,
        openaiConfigured: openaiResult.configured,
        byteplusConfigured: byteplusResult.configured,
        projectDir: lastDir || null,
      })
    } catch { /* API not ready yet */ }
  },
}))
