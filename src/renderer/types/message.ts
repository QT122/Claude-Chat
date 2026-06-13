export interface ToolCall {
  id: string
  name: string
  input: string
  output: string | null
  status: 'pending' | 'parsing' | 'running' | 'done' | 'error'
  isError: boolean
}

export interface FileAttachment {
  id: string
  name: string
  type: string
  size: number
  content: string // base64 for images, text for files
  isImage: boolean
}

export interface MediaItem {
  id: string
  filename: string
  prompt: string
  type: 'image' | 'video'
  dataUrl: string
  createdAt: number
  downloaded: boolean
}

export interface ThinkingSection {
  id: string
  type: 'tool_call' | 'thinking' | 'result'
  title: string
  content: string
  status: 'pending' | 'running' | 'done' | 'error'
  expanded?: boolean
  children?: ThinkingSection[]
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  isStreaming?: boolean
  toolCalls?: ToolCall[]
  thinkingSections?: ThinkingSection[]
  files?: FileAttachment[]
  mediaItems?: MediaItem[]
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
  mode?: 'chat' | 'project'
}

export interface Memory {
  id: string
  title: string
  content: string
  type: 'user' | 'feedback' | 'project' | 'reference'
  createdAt: number
  updatedAt: number
}

export interface Skill {
  id: string
  name: string
  description: string
  icon: string
  systemPrompt: string
  category: 'writing' | 'analysis' | 'development' | 'learning' | 'other'
  active: boolean
  builtIn: boolean
  downloadUrl?: string
  createdAt: number
  updatedAt: number
}
