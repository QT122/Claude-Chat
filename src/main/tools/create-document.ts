import { BrowserWindow, dialog } from 'electron'
import { writeFileSync } from 'fs'
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, Table, TableRow, TableCell, WidthType,
  BorderStyle, ShadingType,
} from 'docx'
import type { ToolDefinition } from './base'

function createDocx(title: string, content: string): Document {
  const children: Paragraph[] = []

  // Title
  children.push(
    new Paragraph({
      text: title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  )

  // Parse content into sections
  const lines = content.split('\n')
  let i = 0
  while (i < lines.length) {
    const line = lines[i].trim()

    if (!line) { i++; continue }

    // Heading detection
    if (line.startsWith('# ')) {
      children.push(new Paragraph({
        text: line.slice(2),
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 300, after: 150 },
      }))
    } else if (line.startsWith('## ')) {
      children.push(new Paragraph({
        text: line.slice(3),
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 250, after: 120 },
      }))
    } else if (line.startsWith('### ')) {
      children.push(new Paragraph({
        text: line.slice(4),
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 100 },
      }))
    } else if (line.startsWith('|') && line.endsWith('|')) {
      // Table parsing
      const tableRows: TableRow[] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const rowLine = lines[i].trim()
        if (!rowLine.includes('---')) {
          const cells = rowLine.split('|').filter(c => c.trim()).map(c =>
            new TableCell({
              children: [new Paragraph({ text: c.trim(), spacing: { after: 0 } })],
              shading: i === 0 ? { type: ShadingType.SOLID, color: '2a2a3e' } : undefined,
            })
          )
          if (cells.length > 0) {
            tableRows.push(new TableRow({ children: cells }))
          }
        }
        i++
      }
      if (tableRows.length > 0) {
        children.push(new Table({
          rows: tableRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
        }))
        children.push(new Paragraph({ text: '', spacing: { after: 100 } }))
        continue
      }
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      // Bullet list
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
        children.push(new Paragraph({
          text: lines[i].trim().slice(2),
          bullet: { level: 0 },
          spacing: { after: 50 },
        }))
        i++
      }
      continue
    } else {
      // Regular paragraph
      children.push(new Paragraph({
        text: line,
        spacing: { after: 100 },
      }))
    }
    i++
  }

  return new Document({
    sections: [{
      properties: {},
      children: children.length > 0 ? children : [new Paragraph({ text: content })]
    }],
  })
}

export const createDocumentTool: ToolDefinition = {
  name: 'create_document',
  displayName: '生成 Word 文档',
  description: 'Create a Word (.docx) document from text content. Supports markdown-like formatting: # headings, - bullet lists, | tables. The user will be prompted to choose where to save the file.',
  inputSchema: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Document title' },
      content: { type: 'string', description: 'Document body content with optional markdown formatting (# headings, - lists, | tables)' },
    },
    required: ['title', 'content'],
  },

  async execute(input) {
    const title = (input.title as string)?.trim()
    const content = (input.content as string)?.trim()

    if (!title || !content) {
      return { content: '请提供文档标题和内容', isError: true }
    }

    try {
      const doc = createDocx(title, content)
      const buffer = await Packer.toBuffer(doc)

      const win = BrowserWindow.getAllWindows()[0]
      if (!win) return { content: '无法打开保存对话框', isError: true }

      const result = await dialog.showSaveDialog(win, {
        defaultPath: `${title}.docx`,
        filters: [{ name: 'Word 文档', extensions: ['docx'] }],
      })

      if (result.canceled || !result.filePath) {
        return { content: '已取消保存' }
      }

      writeFileSync(result.filePath, buffer)
      return { content: `Word 文档已保存到: ${result.filePath}`, metadata: { path: result.filePath } }
    } catch (err) {
      return { content: `生成文档失败: ${err instanceof Error ? err.message : String(err)}`, isError: true }
    }
  },
}
