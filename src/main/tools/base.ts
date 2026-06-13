export interface ToolContext {
  projectDir: string | null
  conversationId: string
  byteplusApiKey?: string
}

export interface ToolResult {
  content: string
  isError?: boolean
  metadata?: Record<string, unknown>
}

export interface ToolDefinition {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties: Record<string, unknown>
    required?: string[]
  }
  displayName?: string
  execute: (input: Record<string, unknown>, context: ToolContext) => Promise<ToolResult>
}
