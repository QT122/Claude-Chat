import electron, { contextBridge, ipcRenderer } from 'electron'

export type ProviderType = 'anthropic' | 'deepseek'

export interface ByteplusUsageData {
  totalSpend: string
  currency: string
  billPeriod: string
  details: Array<{ product: string; amount: string }>
}

export interface WeatherData {
  city: string
  areaName: string
  country: string
  temp: string
  feelsLike: string
  desc: string
  humidity: string
  windSpeed: string
}

export interface ElectronAPI {
  // API Key
  setApiKey: (provider: string, apiKey: string) => Promise<{ success: boolean; error?: string }>
  getApiKey: (provider: string) => Promise<{ apiKey: string | null; configured: boolean }>
  deleteApiKey: (provider: string) => Promise<{ success: boolean }>
  testApiKey: (provider: string, apiKey: string) => Promise<{ valid: boolean; error?: string }>

  // File system
  pickProjectDir: () => Promise<{ path: string | null; canceled: boolean }>
  listFiles: (dirPath: string) => Promise<{ files: Array<{ name: string; path: string; isDirectory: boolean; size: number }>; error?: string }>
  readFile: (filePath: string, projectDir?: string) => Promise<{ content: string | null; error?: string }>
  pickImage: () => Promise<{ path: string | null; dataUrl: string | null; canceled: boolean }>
  pickFiles: () => Promise<{ files: Array<{ id: string; name: string; type: string; size: number; content: string; isImage: boolean }>; canceled: boolean }>
  readBinaryFile: (filePath: string) => Promise<{ content: string | null; isImage: boolean; size: number; error?: string }>
  parseFile: (filePath: string) => Promise<{ content: string | null; isImage: boolean; name: string; error?: string }>
  readContent: (filePath: string) => Promise<{ text: string; isImage: boolean; name: string; size: number }>
  parseRaw: (data: { name: string; data: string; size: number }) => Promise<{ text: string; isImage: boolean; name: string; size: number }>
  downloadFile: (url: string) => Promise<{ success: boolean; path?: string; canceled?: boolean; error?: string }>

  // Chat
  sendMessage: (data: unknown) => Promise<{ success: boolean; error?: string; conversationId?: string }>
  abortMessage: () => Promise<{ success: boolean }>

  // Event listeners
  onToken: (callback: (data: { conversationId: string; token: string; index: number }) => void) => () => void
  onToolCall: (callback: (data: unknown) => void) => () => void
  onToolResult: (callback: (data: unknown) => void) => () => void
  onDone: (callback: (data: { conversationId: string; stopReason: string }) => void) => () => void
  onError: (callback: (data: { conversationId: string; error: string }) => void) => () => void
  onFileChange: (callback: (data: { event: string; filePath: string }) => void) => () => void

  // Conversations
  saveConversation: (conv: { id: string; title: string; messages: unknown[]; createdAt: number; updatedAt: number }) => Promise<{ success: boolean }>
  loadConversation: (id: string) => Promise<{ conversation: unknown | null }>
  listConversations: (mode?: string) => Promise<{ conversations: Array<{ id: string; title: string; createdAt: number; updatedAt: number; mode?: string }> }>
  deleteConversation: (id: string) => Promise<{ success: boolean }>

  // Memory
  listMemories: () => Promise<{ memories: Array<{ id: string; title: string; content: string; type: string; createdAt: number; updatedAt: number }> }>
  getMemory: (id: string) => Promise<{ memory: unknown | null }>
  saveMemory: (mem: { id: string; title: string; content: string; type: string; createdAt: number; updatedAt: number }) => Promise<{ success: boolean }>
  deleteMemory: (id: string) => Promise<{ success: boolean }>

  // Skills
  listSkills: () => Promise<{ skills: Array<{ id: string; name: string; description: string; icon: string; systemPrompt: string; category: string; active: boolean; builtIn: boolean; downloadUrl?: string; createdAt: number; updatedAt: number }> }>
  getSkill: (id: string) => Promise<{ skill: unknown | null }>
  saveSkill: (skill: { id: string; name: string; description: string; icon: string; systemPrompt: string; category: string; active: boolean; builtIn: boolean; createdAt: number; updatedAt: number }) => Promise<{ success: boolean }>
  deleteSkill: (id: string) => Promise<{ success: boolean }>
  downloadSkill: (url: string) => Promise<{ skill: unknown | null; error?: string }>
  getBuiltInSkills: () => Promise<{ skills: Array<{ id: string; name: string; description: string; icon: string; systemPrompt: string; category: string; downloadUrl?: string }> }>

  // App settings
  getSetting: (key: string) => Promise<{ value: unknown }>
  setSetting: (key: string, value: unknown) => Promise<{ success: boolean }>
  saveBackground: (dataUrl: string) => Promise<{ success: boolean }>
  loadBackground: () => Promise<{ dataUrl: string | null }>

  // Avatar
  pickAvatar: () => Promise<{ dataUrl: string | null; canceled: boolean; error?: string }>
  loadAvatar: () => Promise<{ dataUrl: string | null }>
  deleteAvatar: () => Promise<{ success: boolean }>

  // Window controls
  minimize: () => Promise<void>
  maximize: () => Promise<void>
  close: () => Promise<void>
  isMaximized: () => Promise<boolean>
  openExternal: (url: string) => Promise<void>

  // Media
  onMedia: (callback: (data: { conversationId: string; media: { id: string; filename: string; prompt: string; type: 'image' | 'video'; dataUrl: string; createdAt: number; downloaded: boolean } }) => void) => () => void
  listMedia: () => Promise<{ media: Array<{ id: string; filename: string; prompt: string; type: 'image' | 'video'; createdAt: number; downloaded: boolean }> }>
  markDownloaded: (filename: string) => Promise<{ success: boolean }>
  deleteMedia: (filename: string) => Promise<{ success: boolean }>
  getMediaDataUrl: (filename: string) => Promise<{ dataUrl: string | null }>

  // Usage
  getUsage: () => Promise<{
    deepseek: { balance: string; currency: string } | null
    byteplus: { available: boolean; usage: ByteplusUsageData | null; error?: string } | null
  }>

  // BytePlus AK/SK
  saveByteplusAKSK: (ak: string, sk: string) => Promise<{ success: boolean; error?: string }>
  getByteplusAKSK: () => Promise<{ ak: string | null; sk: string | null; configured: boolean }>
  clearByteplusAKSK: () => Promise<{ success: boolean; error?: string }>
  queryByteplusUsage: (ak: string, sk: string, billPeriod?: string) => Promise<{ success: boolean; usage?: ByteplusUsageData; error?: string }>

  // Weather
  getWeather: (city?: string) => Promise<WeatherData | { error: string }>

  // File path utility
  getPathForFile: (file: File) => string | null
}

const api: ElectronAPI = {
  setApiKey: (provider, apiKey) => ipcRenderer.invoke('key:set', provider, apiKey),
  getApiKey: (provider) => ipcRenderer.invoke('key:get', provider),
  deleteApiKey: (provider) => ipcRenderer.invoke('key:delete', provider),
  testApiKey: (provider, apiKey) => ipcRenderer.invoke('key:test', provider, apiKey),

  pickProjectDir: () => ipcRenderer.invoke('fs:pick-dir'),
  listFiles: (dirPath) => ipcRenderer.invoke('fs:list', dirPath),
  readFile: (filePath, projectDir) => ipcRenderer.invoke('fs:read', filePath, projectDir),
  pickImage: () => ipcRenderer.invoke('fs:pick-image'),
  pickFiles: () => ipcRenderer.invoke('fs:pick-files'),
  readBinaryFile: (filePath) => ipcRenderer.invoke('fs:read-binary', filePath),
  parseFile: (filePath) => ipcRenderer.invoke('fs:parse-file', filePath),
  readContent: (filePath) => ipcRenderer.invoke('fs:read-content', filePath),
  parseRaw: (data) => ipcRenderer.invoke('fs:parse-raw', data),
  downloadFile: (url) => ipcRenderer.invoke('fs:download', url),

  sendMessage: (data) => ipcRenderer.invoke('chat:send', data),
  abortMessage: () => ipcRenderer.invoke('chat:abort'),

  onToken: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, data: { conversationId: string; token: string; index: number }) => callback(data)
    ipcRenderer.on('chat:token', handler)
    return () => ipcRenderer.removeListener('chat:token', handler)
  },
  onToolCall: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, data: unknown) => callback(data)
    ipcRenderer.on('chat:tool-call', handler)
    return () => ipcRenderer.removeListener('chat:tool-call', handler)
  },
  onToolResult: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, data: unknown) => callback(data)
    ipcRenderer.on('chat:tool-result', handler)
    return () => ipcRenderer.removeListener('chat:tool-result', handler)
  },
  onDone: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, data: { conversationId: string; stopReason: string }) => callback(data)
    ipcRenderer.on('chat:done', handler)
    return () => ipcRenderer.removeListener('chat:done', handler)
  },
  onError: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, data: { conversationId: string; error: string }) => callback(data)
    ipcRenderer.on('chat:error', handler)
    return () => ipcRenderer.removeListener('chat:error', handler)
  },
  onFileChange: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, data: { event: string; filePath: string }) => callback(data)
    ipcRenderer.on('fs:change', handler)
    return () => ipcRenderer.removeListener('fs:change', handler)
  },

  saveConversation: (conv) => ipcRenderer.invoke('conv:save', conv),
  loadConversation: (id) => ipcRenderer.invoke('conv:load', id),
  listConversations: (mode?: string) => ipcRenderer.invoke('conv:list', mode),
  deleteConversation: (id) => ipcRenderer.invoke('conv:delete', id),

  listMemories: () => ipcRenderer.invoke('mem:list'),
  getMemory: (id) => ipcRenderer.invoke('mem:get', id),
  saveMemory: (mem) => ipcRenderer.invoke('mem:save', mem),
  deleteMemory: (id) => ipcRenderer.invoke('mem:delete', id),

  listSkills: () => ipcRenderer.invoke('skills:list'),
  getSkill: (id) => ipcRenderer.invoke('skills:get', id),
  saveSkill: (skill) => ipcRenderer.invoke('skills:save', skill),
  deleteSkill: (id) => ipcRenderer.invoke('skills:delete', id),
  downloadSkill: (url) => ipcRenderer.invoke('skills:download', url),
  getBuiltInSkills: () => ipcRenderer.invoke('skills:builtin'),

  getSetting: (key) => ipcRenderer.invoke('settings:get', key),
  setSetting: (key, value) => ipcRenderer.invoke('settings:set', key, value),
  saveBackground: (dataUrl) => ipcRenderer.invoke('bg:save', dataUrl),
  loadBackground: () => ipcRenderer.invoke('bg:load'),

  pickAvatar: () => ipcRenderer.invoke('avatar:pick'),
  loadAvatar: () => ipcRenderer.invoke('avatar:load'),
  deleteAvatar: () => ipcRenderer.invoke('avatar:delete'),

  minimize: () => ipcRenderer.invoke('win:minimize'),
  maximize: () => ipcRenderer.invoke('win:maximize'),
  close: () => ipcRenderer.invoke('win:close'),
  isMaximized: () => ipcRenderer.invoke('win:is-maximized'),
  openExternal: (url) => ipcRenderer.invoke('win:open-external', url),

  onMedia: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, data: { conversationId: string; media: { id: string; filename: string; prompt: string; type: 'image' | 'video'; dataUrl: string; createdAt: number; downloaded: boolean } }) => callback(data)
    ipcRenderer.on('chat:media', handler)
    return () => ipcRenderer.removeListener('chat:media', handler)
  },
  listMedia: () => ipcRenderer.invoke('media:list'),
  markDownloaded: (filename) => ipcRenderer.invoke('media:download', filename),
  deleteMedia: (filename) => ipcRenderer.invoke('media:delete', filename),
  getMediaDataUrl: (filename) => ipcRenderer.invoke('media:get-data-url', filename),

  getUsage: () => ipcRenderer.invoke('key:usage'),

  saveByteplusAKSK: (ak, sk) => ipcRenderer.invoke('byteplus:save-aksk', ak, sk),
  getByteplusAKSK: () => ipcRenderer.invoke('byteplus:get-aksk'),
  clearByteplusAKSK: () => ipcRenderer.invoke('byteplus:clear-aksk'),
  queryByteplusUsage: (ak, sk, billPeriod) => ipcRenderer.invoke('byteplus:query-usage', ak, sk, billPeriod),

  getWeather: (city) => ipcRenderer.invoke('weather:get', city),

  getPathForFile: (file: File) => {
    try {
      if (electron.webUtils) return electron.webUtils.getPathForFile(file)
    } catch { /* fallback */ }
    return (file as any).path || null
  },
}

contextBridge.exposeInMainWorld('api', api)
