import { readFileSync, statSync } from 'fs'
import { extname } from 'path'
import AdmZip from 'adm-zip'
import ExcelJS from 'exceljs'

const TEXT_EXTS = new Set([
  '.txt', '.md', '.json', '.xml', '.html', '.htm', '.css', '.scss', '.less',
  '.js', '.jsx', '.ts', '.tsx', '.py', '.rs', '.go', '.java', '.c', '.cpp',
  '.h', '.hpp', '.rb', '.php', '.swift', '.kt', '.sh', '.bat', '.ps1',
  '.yml', '.yaml', '.toml', '.ini', '.cfg', '.env', '.gitignore',
  '.sql', '.r', '.m', '.mm', '.pl', '.lua', '.vue', '.svelte',
  '.csv', '.tsv', '.log', '.svg',
])

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'])

export function isImageExt(ext: string): boolean {
  return IMAGE_EXTS.has(ext.toLowerCase())
}

export function canParseText(ext: string): boolean {
  return TEXT_EXTS.has(ext.toLowerCase())
}

function extractXmlText(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`, 'g')
  const matches = xml.match(regex)
  if (!matches) return ''
  return matches
    .map((t) => t.replace(/<[^>]+>/g, ''))
    .filter((t) => t.trim())
    .join('')
}

export async function parseFile(filePath: string): Promise<{ text: string; error?: string }> {
  const ext = extname(filePath).toLowerCase()

  if (TEXT_EXTS.has(ext)) {
    try {
      const content = readFileSync(filePath, 'utf-8')
      return { text: content }
    } catch (err) {
      return { text: '', error: String(err) }
    }
  }

  // PDF — metadata only
  if (ext === '.pdf') {
    const stat = statSync(filePath)
    return { text: `[PDF 文件, ${(stat.size / 1024).toFixed(1)}KB。请复制文字内容粘贴到对话框。]` }
  }

  // Word (.docx) — pure raw XML extraction
  if (ext === '.docx') {
    try {
      const buffer = readFileSync(filePath)
      if (!buffer || buffer.length === 0) {
        return { text: '', error: '文件为空或无法读取' }
      }

      let zip: AdmZip
      try {
        zip = new AdmZip(buffer)
      } catch (zipErr) {
        return { text: '', error: `ZIP 解压失败 (文件可能已损坏): ${String(zipErr)}` }
      }

      const entries = zip.getEntries()
      if (!entries || entries.length === 0) {
        return { text: '', error: 'ZIP 包内无文件' }
      }

      const allText: string[] = []
      let xmlCount = 0

      for (const entry of entries) {
        if (!entry.entryName.endsWith('.xml')) continue
        const name = entry.entryName
        if (name.includes('theme') || name.includes('fontTable') ||
            name.includes('settings') || name.includes('styles') ||
            name.includes('webSettings')) continue

        xmlCount++
        try {
          const xml = entry.getData().toString('utf-8')
          const text = extractXmlText(xml, 'w:t')
          if (text) {
            const source = name.replace('word/', '').replace('.xml', '')
            allText.push(`[${source}]\n${text}`)
          }
        } catch { /* skip bad XML */ }
      }

      const combined = allText.join('\n\n').trim()
      if (combined) return { text: combined.slice(0, 50000) }
      return { text: '', error: `Word 文档无文字内容 (${entries.length} 个文件, ${xmlCount} 个 XML)` }
    } catch (err) {
      return { text: '', error: `Word 解析异常: ${String(err)}` }
    }
  }

  // Excel (.xlsx, .xls)
  if (ext === '.xlsx' || ext === '.xls') {
    try {
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.readFile(filePath)
      const sheets: string[] = []
      workbook.eachSheet((sheet) => {
        const rows: string[] = []
        rows.push(`## Sheet: ${sheet.name}`)
        if (sheet.rowCount > 100) {
          rows.push(`(共 ${sheet.rowCount} 行，仅显示前 100 行)`)
        }
        const dataRows = sheet.getRows(1, Math.min(sheet.rowCount, 100))
        if (dataRows && dataRows.length > 0) {
          for (const row of dataRows) {
            if (row.values && Array.isArray(row.values)) {
              const vals = row.values.slice(1)
              rows.push(vals.filter((v) => v != null).join('\t'))
            }
          }
        }
        sheets.push(rows.join('\n'))
      })
      const output = sheets.join('\n\n').trim()
      if (output) return { text: output.slice(0, 50000) }
      return { text: '', error: '表格无数据' }
    } catch (err) {
      return { text: '', error: `Excel 解析失败: ${String(err)}` }
    }
  }

  // PowerPoint (.pptx)
  if (ext === '.pptx') {
    try {
      const buffer = readFileSync(filePath)
      const zip = new AdmZip(buffer)
      const slides: string[] = []
      const slideEntries = zip.getEntries()
        .filter((e) => e.entryName.startsWith('ppt/slides/slide') && e.entryName.endsWith('.xml'))
        .sort((a, b) => a.entryName.localeCompare(b.entryName))

      for (let i = 0; i < slideEntries.length; i++) {
        const xml = slideEntries[i].getData().toString('utf-8')
        const text = extractXmlText(xml, 'a:t')
        if (text) slides.push(`Slide ${i + 1}: ${text}`)
      }
      return { text: slides.join('\n').slice(0, 50000) || '(PPT 无文字内容)' }
    } catch (err) {
      return { text: '', error: `PPT 解析失败: ${String(err)}` }
    }
  }

  // ZIP / RAR — list contents
  if (ext === '.zip' || ext === '.rar') {
    try {
      const zip = new AdmZip(readFileSync(filePath))
      const entries = zip.getEntries()
      const listing = entries
        .slice(0, 200)
        .map((e) =>
          `${e.isDirectory ? '[DIR]' : '[FILE]'} ${e.entryName} (${e.header.size} bytes)`)
        .join('\n')
      const summary = entries.length > 200
        ? `共 ${entries.length} 个文件，显示前 200 个:\n${listing}`
        : `共 ${entries.length} 个文件:\n${listing}`
      return { text: summary }
    } catch (err) {
      return { text: '', error: `压缩包解析失败: ${String(err)}` }
    }
  }

  if (ext === '.7z') {
    return { text: '[.7z 压缩文件，暂不支持内容预览。请解压后查看。]' }
  }

  try {
    const stat = statSync(filePath)
    return {
      text: `[二进制文件: ${filePath.split(/[/\\]/).pop()}, 大小: ${(stat.size / 1024).toFixed(1)} KB, 类型: ${ext || '未知'}]`,
    }
  } catch {
    return { text: `[无法读取的文件: ${ext || '未知类型'}]` }
  }
}
