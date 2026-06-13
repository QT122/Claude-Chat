import { BrowserWindow, dialog } from 'electron'
import { writeFileSync } from 'fs'
import PptxGenJS from 'pptxgenjs'
import type { ToolDefinition } from './base'

function createPptx(title: string, slides: Array<{ title: string; content: string }>): PptxGenJS {
  const pptx = new PptxGenJS()

  pptx.layout = 'LAYOUT_WIDE'
  pptx.author = 'Claude Chat'
  pptx.title = title

  for (const slide of slides) {
    const s = pptx.addSlide()

    s.addText(slide.title, {
      x: 0.5, y: 0.3, w: '90%', h: 0.8,
      fontSize: 28, bold: true, color: '2B3674',
      align: 'left',
    })

    // Split content into bullet points
    const bullets = slide.content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line)
      .map(line => ({
        text: line.replace(/^[-*]\s*/, ''),
        options: { fontSize: 16, color: '333333', bullet: true, breakLine: true },
      }))

    if (bullets.length > 0) {
      s.addText(bullets, {
        x: 0.8, y: 1.3, w: '85%', h: 4.5,
        valign: 'top',
      })
    }

    // Add slide number
    s.addText(`${slides.indexOf(slide) + 1}`, {
      x: '90%', y: '92%', w: '10%', h: 0.4,
      fontSize: 10, color: '999999', align: 'right',
    })
  }

  return pptx
}

export const createPresentationTool: ToolDefinition = {
  name: 'create_presentation',
  displayName: '生成 PPT',
  description: 'Create a PowerPoint (.pptx) presentation. Provide a title and an array of slides, each with a title and bullet-point content. The user will be prompted to save the file.',
  inputSchema: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Presentation title' },
      slides: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Slide title' },
            content: { type: 'string', description: 'Slide content, use - for bullet points, one per line' },
          },
          required: ['title', 'content'],
        },
        description: 'Array of slide objects',
      },
    },
    required: ['title', 'slides'],
  },

  async execute(input) {
    const title = (input.title as string)?.trim()
    const slides = (input.slides as Array<{ title: string; content: string }>) || []

    if (!title || slides.length === 0) {
      return { content: '请提供演示文稿标题和幻灯片内容', isError: true }
    }

    try {
      const pptx = createPptx(title, slides)
      const buffer = await pptx.write({ outputType: 'nodebuffer' }) as Buffer

      const win = BrowserWindow.getAllWindows()[0]
      if (!win) return { content: '无法打开保存对话框', isError: true }

      const result = await dialog.showSaveDialog(win, {
        defaultPath: `${title}.pptx`,
        filters: [{ name: 'PowerPoint 演示文稿', extensions: ['pptx'] }],
      })

      if (result.canceled || !result.filePath) {
        return { content: '已取消保存' }
      }

      writeFileSync(result.filePath, buffer)
      return { content: `PPT 已保存到: ${result.filePath}`, metadata: { path: result.filePath, slideCount: slides.length } }
    } catch (err) {
      return { content: `生成 PPT 失败: ${err instanceof Error ? err.message : String(err)}`, isError: true }
    }
  },
}
