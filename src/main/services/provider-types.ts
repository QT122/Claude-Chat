export type ProviderType = 'anthropic' | 'deepseek'

export interface FileAttachment {
  id: string
  name: string
  type: string
  size: number
  content: string
  isImage: boolean
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  files?: FileAttachment[]
}

export interface StreamEvents {
  token: (data: { conversationId: string; token: string; index: number }) => void
  toolCall: (data: { conversationId: string; toolCall: { id: string; name: string; status: string; input: string } }) => void
  toolResult: (data: { conversationId: string; toolResult: { id: string; status: string; content: string; isError: boolean } }) => void
  done: (data: { conversationId: string; stopReason: string }) => void
  error: (data: { conversationId: string; error: string }) => void
}

export interface StreamParams {
  conversationId: string
  messages: ChatMessage[]
  systemPrompt?: string
  apiKey: string
  model: string
  maxTokens?: number
  projectDir?: string | null
  tools?: ToolDef[]
  byteplusApiKey?: string
  onToolExecute?: (name: string, input: Record<string, unknown>) => Promise<{ content: string; isError?: boolean }>
}

export interface ToolDef {
  name: string
  description: string
  input_schema: {
    type: 'object'
    properties: Record<string, unknown>
    required?: string[]
  }
}

export interface ProviderAdapter {
  stream(params: StreamParams, emit: StreamEvents): Promise<void>
}
