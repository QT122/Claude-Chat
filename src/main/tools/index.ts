import { ToolRegistry } from './registry'
import { readFileTool } from './read-file'
import { listDirectoryTool } from './list-directory'
import { searchContentTool } from './search-content'
import { saveMemoryTool } from './save-memory'
import { writeFileTool } from './write-file'
import { editFileTool } from './edit-file'
import { webSearchTool } from './web-search'
import { webFetchTool } from './web-fetch'
import { webImagesTool } from './web-images'
import { createDocumentTool } from './create-document'
import { createPresentationTool } from './create-presentation'
import { createSpreadsheetTool } from './create-spreadsheet'
import { generateImageTool } from './generate-image'
import { generateVideoTool } from './generate-video'

let registry: ToolRegistry | null = null

export function getToolRegistry(): ToolRegistry {
  if (!registry) {
    registry = new ToolRegistry()
    registry.register(readFileTool)
    registry.register(listDirectoryTool)
    registry.register(searchContentTool)
    registry.register(saveMemoryTool)
    registry.register(writeFileTool)
    registry.register(editFileTool)
    registry.register(webSearchTool)
    registry.register(webFetchTool)
    registry.register(webImagesTool)
    registry.register(createDocumentTool)
    registry.register(createPresentationTool)
    registry.register(createSpreadsheetTool)
    registry.register(generateImageTool)
    registry.register(generateVideoTool)
  }
  return registry
}

export { ToolRegistry } from './registry'
export type { ToolDefinition, ToolContext, ToolResult } from './base'
