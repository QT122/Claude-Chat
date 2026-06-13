import { ipcMain, dialog, BrowserWindow, app } from 'electron'
import { readFileSync, readdirSync, statSync, writeFileSync, openSync, readSync, closeSync } from 'fs'
import { join, resolve, extname } from 'path'
import { isImageExt, canParseText, parseFile } from '../services/file-parser'

function ipcDebug(msg: string) {
  try {
    writeFileSync(join(app.getPath('userData'), 'parser-debug.log'), `[IPC ${new Date().toISOString()}] ${msg}\n`, { flag: 'a' })
  } catch { /* ignore */ }
}

function validatePath(requestedPath: string, projectRoot: string): string {
  const resolved = resolve(projectRoot, requestedPath)
  const normalizedRoot = resolve(projectRoot)
  if (!resolved.startsWith(normalizedRoot)) {
    throw new Error(`路径越界: ${requestedPath}`)
  }
  return resolved
}

export interface FileEntry {
  name: string
  path: string
  isDirectory: boolean
  size: number
}

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg']

export function registerFileSystemHandlers(): void {
  ipcMain.handle('fs:pick-dir', async () => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return { path: null, canceled: true }

    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory'],
      title: '选择项目目录',
    })

    if (result.canceled || result.filePaths.length === 0) {
      return { path: null, canceled: true }
    }

    return { path: result.filePaths[0], canceled: false }
  })

  ipcMain.handle('fs:list', (_event, dirPath: string) => {
    try {
      const entries = readdirSync(dirPath, { withFileTypes: true })
      const files: FileEntry[] = entries.map((entry) => {
        const fullPath = join(dirPath, entry.name)
        let size = 0
        try {
          const st = statSync(fullPath)
          size = st.size
        } catch { /* ignore */ }
        return {
          name: entry.name,
          path: fullPath,
          isDirectory: entry.isDirectory(),
          size,
        }
      })
      return { files }
    } catch (err) {
      return { files: [], error: String(err) }
    }
  })

  ipcMain.handle('fs:read', async (_event, filePath: string, projectDir?: string) => {
    try {
      if (projectDir) {
        filePath = validatePath(filePath, projectDir)
      }
      const ext = extname(filePath).toLowerCase()
      const MAX_TEXT_SIZE = 500 * 1024
      writeFileSync(join(app.getPath('userData'), 'fs-read.log'), `[${new Date().toISOString()}] READ: ${filePath} ext=${ext}\n`, { flag: 'a' })

      // Images — read with limit, return base64 data URL
      if (isImageExt(ext)) {
        const { readFile } = await import('fs/promises')
        const stat = statSync(filePath)
        const MAX_IMAGE_SIZE = 2 * 1024 * 1024 // 2MB limit for inline display
        if (stat.size > MAX_IMAGE_SIZE) {
          return { content: `[图片过大: ${(stat.size / 1024 / 1024).toFixed(1)}MB，请用外部程序打开]`, isImage: false, tooLarge: true }
        }
        const buffer = await readFile(filePath)
        const mimeMap: Record<string, string> = {
          '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
          '.gif': 'image/gif', '.webp': 'image/webp', '.bmp': 'image/bmp', '.svg': 'image/svg+xml',
        }
        const mime = mimeMap[ext] || 'image/png'
        const dataUrl = `data:${mime};base64,${buffer.toString('base64')}`
        return { content: dataUrl, isImage: true }
      }

      // Binary formats — inline parsing
      if (!canParseText(ext)) {
        let content = ''
        const buffer = readFileSync(filePath)
        try {
          if (ext === '.docx') {
            const AdmZip = require('adm-zip')
            const zip = new AdmZip(buffer)
            const extractText = (xml: string) => {
              const parts: string[] = []
              const paragraphs = xml.split(/<w:p[ >]/)
              for (const para of paragraphs) {
                const m = para.match(/<w:t[^>]*>([^<]*)<\/w:t>/g)
                if (m) { const line = m.map((t: string) => t.replace(/<[^>]+>/g, '')).join(''); if (line.trim()) parts.push(line.trim()) }
              }
              return parts.join('\n')
            }
            const docEntry = zip.getEntry('word/document.xml')
            const parts: string[] = []
            if (docEntry) { const t = extractText(docEntry.getData().toString('utf-8')); if (t) parts.push(t) }
            for (const e of zip.getEntries()) {
              if (!e.entryName.endsWith('.xml') || e.entryName === 'word/document.xml') continue
              if (e.entryName.includes('theme') || e.entryName.includes('fontTable') || e.entryName.includes('settings') || e.entryName.includes('styles')) continue
              try { const t = extractText(e.getData().toString('utf-8')); if (t) parts.push(`[${e.entryName.replace('word/', '').replace('.xml', '')}]\n${t}`) } catch { /* skip */ }
            }
            content = parts.join('\n\n').trim() || '(文档无文字)'
          } else if (ext === '.pdf') {
            try { const pdfParse = require('pdf-parse'); const d = await pdfParse(buffer); content = (d.text || '').trim().slice(0, 50000) || `[PDF 无文字]` } catch { content = `[PDF 解析失败]` }
          } else {
            content = `[${filePath.split(/[/\\]/).pop()}, ${(buffer.length / 1024).toFixed(1)}KB, 类型: ${ext}]`
          }
        } catch (err) {
          content = `解析失败: ${String(err)}`
        }
        return { content, isImage: false }
      }

      // Text files — read with size limit
      const stat = statSync(filePath)
      if (stat.size > MAX_TEXT_SIZE) {
        const fd = openSync(filePath, 'r')
        const buf = Buffer.alloc(MAX_TEXT_SIZE)
        readSync(fd, buf, 0, MAX_TEXT_SIZE, 0)
        closeSync(fd)
        return { content: buf.toString('utf-8') + '\n\n... (文件过大，仅显示前 500KB)', isImage: false }
      }

      const content = readFileSync(filePath, 'utf-8')
      return { content, isImage: false }
    } catch (err) {
      return { content: null, error: String(err), isImage: false }
    }
  })

  ipcMain.handle('fs:pick-image', async () => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return { path: null, dataUrl: null, canceled: true }

    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile'],
      title: '选择背景图片',
      filters: [{ name: '图片', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'] }],
    })

    if (result.canceled || result.filePaths.length === 0) {
      return { path: null, dataUrl: null, canceled: true }
    }

    const filePath = result.filePaths[0]
    const buffer = readFileSync(filePath)
    const ext = extname(filePath).toLowerCase().replace('.', '')
    const mimeMap: Record<string, string> = {
      png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
      gif: 'image/gif', webp: 'image/webp', bmp: 'image/bmp',
    }
    const mime = mimeMap[ext] || 'image/png'
    const dataUrl = `data:${mime};base64,${buffer.toString('base64')}`

    return { path: filePath, dataUrl, canceled: false }
  })

  ipcMain.handle('fs:pick-files', async () => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return { files: [], canceled: true }

    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile', 'multiSelections'],
      title: '选择文件上传',
    })

    if (result.canceled || result.filePaths.length === 0) {
      return { files: [], canceled: true }
    }

    const filePromises = result.filePaths.map(async (filePath) => {
      try {
      const buffer = readFileSync(filePath)
      const name = filePath.split(/[/\\]/).pop() || 'file'
      const ext = extname(filePath).toLowerCase()
      const isImage = isImageExt(ext)

      if (isImage) {
        return {
          id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
          name,
          type: ext.replace('.', ''),
          size: buffer.length,
          content: buffer.toString('base64'),
          isImage: true,
        }
      }

      if (canParseText(ext)) {
        return {
          id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
          name,
          type: ext.replace('.', ''),
          size: buffer.length,
          content: buffer.toString('utf-8'),
          isImage: false,
        }
      }

      // Inline parsing for all binary formats
      let content = ''
      try {
        if (ext === '.docx') {
          const AdmZip = require('adm-zip')
          const zip = new AdmZip(buffer)
          const extractText = (xml: string) => {
            const parts: string[] = []
            const paragraphs = xml.split(/<w:p[ >]/)
            for (const para of paragraphs) {
              const m = para.match(/<w:t[^>]*>([^<]*)<\/w:t>/g)
              if (m) {
                const line = m.map((t: string) => t.replace(/<[^>]+>/g, '')).join('')
                if (line.trim()) parts.push(line.trim())
              }
            }
            return parts.join('\n')
          }
          const docEntry = zip.getEntry('word/document.xml')
          const parts: string[] = []
          if (docEntry) {
            const text = extractText(docEntry.getData().toString('utf-8'))
            if (text) parts.push(text)
          }
          for (const e of zip.getEntries()) {
            if (!e.entryName.endsWith('.xml') || e.entryName === 'word/document.xml') continue
            if (e.entryName.includes('theme') || e.entryName.includes('fontTable') || e.entryName.includes('settings') || e.entryName.includes('styles')) continue
            try {
              const text = extractText(e.getData().toString('utf-8'))
              if (text) parts.push(`[${e.entryName.replace('word/', '').replace('.xml', '')}]\n${text}`)
            } catch { /* skip */ }
          }
          content = parts.join('\n\n').trim() || '(文档无文字)'
        } else if (ext === '.xlsx' || ext === '.xls') {
          const ExcelJS = require('exceljs')
          const wb = new ExcelJS.Workbook()
          await wb.xlsx.readFile(filePath)
          const sheets: string[] = []
          wb.eachSheet((sheet: any) => {
            const rows = [`Sheet: ${sheet.name}`]
            sheet.getRows(1, Math.min(sheet.rowCount, 100))?.forEach((row: any) => {
              if (row.values) rows.push(row.values.slice(1).filter((v: any) => v != null).join('\t'))
            })
            sheets.push(rows.join('\n'))
          })
          content = sheets.join('\n\n').slice(0, 30000)
        } else if (ext === '.pptx') {
          const AdmZip = require('adm-zip')
          const zip = new AdmZip(buffer)
          content = zip.getEntries()
            .filter((e: any) => e.entryName.startsWith('ppt/slides/slide') && e.entryName.endsWith('.xml'))
            .sort((a: any, b: any) => a.entryName.localeCompare(b.entryName))
            .map((e: any, i: number) => {
              const xml = e.getData().toString('utf-8')
              const m = xml.match(/<a:t[^>]*>([^<]*)<\/a:t>/g)
              return m ? `Slide ${i + 1}: ${m.map((t: string) => t.replace(/<[^>]+>/g, '')).join(' | ')}` : ''
            }).join('\n').slice(0, 30000) || '(PPT无文字)'
        } else if (ext === '.pdf') {
          try { const pdfParse = require('pdf-parse'); const d = await pdfParse(buffer); content = (d.text || '').trim().slice(0, 50000) || `[PDF 无文字: ${name}]` } catch { content = `[PDF 解析失败: ${name}]` }
        } else if (ext === '.zip' || ext === '.rar') {
          const AdmZip = require('adm-zip')
          const zip = new AdmZip(buffer)
          content = zip.getEntries().slice(0, 100).map((e: any) => `${e.isDirectory ? '[D]' : '[F]'} ${e.entryName}`).join('\n')
        } else {
          content = `[${name}, ${(buffer.length / 1024).toFixed(1)}KB, 类型: ${ext}]`
        }
      } catch (err) {
        content = `解析失败: ${String(err)}`
      }
      return {
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
        name,
        type: ext.replace('.', ''),
        size: buffer.length,
        content,
        isImage: false,
      }
      } catch (err) {
        return {
          id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
          name: filePath.split(/[/\\]/).pop() || 'file',
          type: extname(filePath).toLowerCase().replace('.', ''),
          size: 0,
          content: `读取失败: ${String(err)}`,
          isImage: false,
        }
      }
    })

    const files = await Promise.all(filePromises)
    return { files, canceled: false }
  })

  ipcMain.handle('fs:parse-file', async (_event, filePath: string) => {
    try {
      ipcDebug(`fs:parse-file called: ${filePath}`)
      const ext = extname(filePath).toLowerCase()
      if (isImageExt(ext)) {
        const buffer = readFileSync(filePath)
        return { content: buffer.toString('base64'), isImage: true, name: filePath.split(/[/\\]/).pop() || 'file' }
      }
      if (canParseText(ext)) {
        const content = readFileSync(filePath, 'utf-8')
        return { content, isImage: false, name: filePath.split(/[/\\]/).pop() || 'file' }
      }
      const parsed = await parseFile(filePath)
      ipcDebug(`fs:parse-file result: text=${parsed.text?.length || 0} chars, error=${parsed.error || 'none'}`)
      return { content: parsed.text || parsed.error || '', isImage: false, name: filePath.split(/[/\\]/).pop() || 'file' }
    } catch (err) {
      ipcDebug(`fs:parse-file ERROR: ${String(err)}`)
      return { content: null, error: String(err) }
    }
  })

  ipcMain.handle('fs:read-binary', async (_event, filePath: string) => {
    try {
      const buffer = readFileSync(filePath)
      const ext = extname(filePath).toLowerCase()
      const isImage = isImageExt(ext)

      if (isImage) {
        return { content: buffer.toString('base64'), isImage: true, size: buffer.length }
      }

      if (canParseText(ext)) {
        return { content: buffer.toString('utf-8'), isImage: false, size: buffer.length }
      }

      const parsed = await parseFile(filePath)
      return { content: parsed.text || parsed.error || '', isImage: false, size: buffer.length }
    } catch (err) {
      return { content: null, error: String(err) }
    }
  })

  // Parse raw file data (base64) — for drag-drop that can't get file path
  ipcMain.handle('fs:parse-raw', async (_event, rawData: { name: string; data: string; size: number }) => {
    try {
      const buffer = Buffer.from(rawData.data, 'base64')
      const path = require('path')
      const ext = path.extname(rawData.name).toLowerCase()
      const name = rawData.name
      const size = rawData.size

      // Same inline parsing as pick-files
      let text = ''
      if (ext === '.docx') {
        const AdmZip = require('adm-zip')
        const zip = new AdmZip(buffer)
        const extractText = (xml: string) => {
          const parts: string[] = []
          const paragraphs = xml.split(/<w:p[ >]/)
          for (const para of paragraphs) {
            const m = para.match(/<w:t[^>]*>([^<]*)<\/w:t>/g)
            if (m) {
              const line = m.map((t: string) => t.replace(/<[^>]+>/g, '')).join('')
              if (line.trim()) parts.push(line.trim())
            }
          }
          return parts.join('\n')
        }
        const docEntry = zip.getEntry('word/document.xml')
        const parts: string[] = []
        if (docEntry) {
          const t = extractText(docEntry.getData().toString('utf-8'))
          if (t) parts.push(t)
        }
        for (const e of zip.getEntries()) {
          if (!e.entryName.endsWith('.xml') || e.entryName === 'word/document.xml') continue
          if (e.entryName.includes('theme') || e.entryName.includes('fontTable') || e.entryName.includes('settings') || e.entryName.includes('styles')) continue
          try { const t = extractText(e.getData().toString('utf-8')); if (t) parts.push(`[${e.entryName.replace('word/', '').replace('.xml', '')}]\n${t}`) } catch { /* skip */ }
        }
        text = parts.join('\n\n').trim() || '(文档无文字)'
      } else if (ext === '.xlsx' || ext === '.xls') {
        const ExcelJS = require('exceljs')
        const wb = new ExcelJS.Workbook()
        await wb.xlsx.load(buffer)
        const sheets: string[] = []
        wb.eachSheet((sheet: any) => {
          const rows = [`Sheet: ${sheet.name}`]
          sheet.getRows(1, Math.min(sheet.rowCount, 100))?.forEach((row: any) => {
            if (row.values) rows.push(row.values.slice(1).filter((v: any) => v != null).join('\t'))
          })
          sheets.push(rows.join('\n'))
        })
        text = sheets.join('\n\n').slice(0, 30000)
      } else if (ext === '.pptx') {
        const AdmZip = require('adm-zip')
        const zip = new AdmZip(buffer)
        text = zip.getEntries()
          .filter((e: any) => e.entryName.startsWith('ppt/slides/slide') && e.entryName.endsWith('.xml'))
          .sort((a: any, b: any) => a.entryName.localeCompare(b.entryName))
          .map((e: any, i: number) => {
            const xml = e.getData().toString('utf-8')
            const m = xml.match(/<a:t[^>]*>([^<]*)<\/a:t>/g)
            return m ? `Slide ${i + 1}: ${m.map((t: string) => t.replace(/<[^>]+>/g, '')).join(' | ')}` : ''
          }).join('\n').slice(0, 30000) || '(PPT无文字)'
      } else if (ext === '.pdf') {
        try {
          const pdfParse = require('pdf-parse')
          const data = await pdfParse(buffer)
          text = (data.text || '').trim().slice(0, 50000) || `[PDF 无文字: ${name}]`
        } catch { text = `[PDF 解析失败: ${name}]` }
      } else if (ext === '.zip' || ext === '.rar') {
        const AdmZip = require('adm-zip')
        const zip = new AdmZip(buffer)
        text = zip.getEntries().slice(0, 100).map((e: any) => `${e.isDirectory ? '[D]' : '[F]'} ${e.entryName}`).join('\n')
      } else {
        text = `[${name}, ${(size / 1024).toFixed(1)}KB, 类型: ${ext}]`
      }
      return { text, isImage: false, name, size }
    } catch (err) {
      return { text: `解析失败: ${String(err)}`, isImage: false, name: rawData.name, size: rawData.size }
    }
  })

  // File content reader by path — works for all types
  ipcMain.handle('fs:read-content', async (_event, filePath: string) => {
    try {
      const fs = require('fs')
      const path = require('path')
      const ext = path.extname(filePath).toLowerCase()
      const name = path.basename(filePath)

      const buffer = fs.readFileSync(filePath)
      const size = buffer.length

      // Images → base64
      if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'].includes(ext)) {
        return { text: buffer.toString('base64'), isImage: true, name, size }
      }

      // Plain text files → utf-8
      const textExts = ['.txt', '.md', '.json', '.xml', '.html', '.css', '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.c', '.cpp', '.csv', '.yml', '.yaml', '.log', '.sh', '.bat']
      if (textExts.includes(ext)) {
        return { text: buffer.toString('utf-8'), isImage: false, name, size }
      }

      // docx → extract XML text with paragraph structure
      if (ext === '.docx') {
        const AdmZip = require('adm-zip')
        const zip = new AdmZip(buffer)

        const extractText = (xml) => {
          // Split by <w:p> (paragraphs) first, then extract <w:t> within each
          const paragraphs = xml.split(/<w:p[ >]/)
          const lines = []
          for (const para of paragraphs) {
            const m = para.match(/<w:t[^>]*>([^<]*)<\/w:t>/g)
            if (m) {
              const line = m.map((t) => t.replace(/<[^>]+>/g, '')).join('')
              if (line.trim()) lines.push(line.trim())
            }
          }
          return lines.join('\n')
        }

        const parts = []
        // Process document.xml first (main body)
        const docEntry = zip.getEntry('word/document.xml')
        if (docEntry) {
          const text = extractText(docEntry.getData().toString('utf-8'))
          if (text) parts.push(text)
        }

        // Then other XMLs
        for (const e of zip.getEntries()) {
          if (!e.entryName.endsWith('.xml')) continue
          if (e.entryName === 'word/document.xml') continue // already done
          if (e.entryName.includes('theme') || e.entryName.includes('fontTable') || e.entryName.includes('settings') || e.entryName.includes('styles') || e.entryName.includes('webSettings')) continue
          try {
            const text = extractText(e.getData().toString('utf-8'))
            if (text) parts.push(`[${e.entryName.replace('word/', '').replace('.xml', '')}]\n${text}`)
          } catch { /* skip */ }
        }
        const text = parts.join('\n\n').trim()
        fs.writeFileSync(logPath, `  -> DOCX extracted ${text.length} chars\n`, { flag: 'a' })
        return { text: text.slice(0, 50000) || '(文档无文字)', isImage: false, name, size }
      }

      // xlsx → basic cell extraction
      if (ext === '.xlsx' || ext === '.xls') {
        const ExcelJS = require('exceljs')
        const wb = new ExcelJS.Workbook()
        await wb.xlsx.readFile(filePath)
        const sheets = []
        wb.eachSheet((sheet) => {
          const rows = [`Sheet: ${sheet.name}`]
          sheet.getRows(1, Math.min(sheet.rowCount, 100))?.forEach((row) => {
            if (row.values) rows.push(row.values.slice(1).filter((v) => v != null).join('\t'))
          })
          sheets.push(rows.join('\n'))
        })
        return { text: sheets.join('\n\n').slice(0, 30000), isImage: false, name, size }
      }

      // pptx → extract slide text
      if (ext === '.pptx') {
        const AdmZip = require('adm-zip')
        const zip = new AdmZip(buffer)
        const slides = zip.getEntries()
          .filter((e) => e.entryName.startsWith('ppt/slides/slide') && e.entryName.endsWith('.xml'))
          .sort((a, b) => a.entryName.localeCompare(b.entryName))
          .map((e, i) => {
            const xml = e.getData().toString('utf-8')
            const m = xml.match(/<a:t[^>]*>([^<]*)<\/a:t>/g)
            return m ? `Slide ${i + 1}: ${m.map((t) => t.replace(/<[^>]+>/g, '')).join(' | ')}` : ''
          })
        return { text: slides.join('\n').slice(0, 30000) || '(PPT无文字)', isImage: false, name, size }
      }

      // PDF — metadata only (pdf-parse v2 has incompatible API)
      if (ext === '.pdf') {
        try { const pdfParse = require('pdf-parse'); const d = await pdfParse(buffer); const t = (d.text || '').trim(); return { text: t ? t.slice(0, 50000) : `[PDF 无文字: ${name}]`, isImage: false, name, size } } catch { return { text: `[PDF 解析失败: ${name}]`, isImage: false, name, size } }
      }

      // ZIP — list contents
      if (ext === '.zip' || ext === '.rar') {
        const AdmZip = require('adm-zip')
        const zip = new AdmZip(buffer)
        const listing = zip.getEntries().slice(0, 100).map((e) => `${e.isDirectory ? '[D]' : '[F]'} ${e.entryName}`).join('\n')
        return { text: listing, isImage: false, name, size }
      }

      // Unknown — metadata only
      const metaText = `[${name}, ${(size / 1024).toFixed(1)}KB, 类型: ${ext}]`
      fs.writeFileSync(logPath, `  -> UNKNOWN, returning: ${metaText}\n`, { flag: 'a' })
      return { text: metaText, isImage: false, name, size }
    } catch (err) {
      fs.writeFileSync(logPath, `  -> ERROR: ${String(err)}\n`, { flag: 'a' })
      return { text: `读取失败: ${String(err)}`, isImage: false, name, size: 0 }
    }
  })

  ipcMain.handle('fs:download', async (event, url: string) => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender)
      if (!win) return { success: false, error: 'No window' }

      // Download the file
      const response = await fetch(url)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const buffer = Buffer.from(await response.arrayBuffer())

      // Extract filename from URL or content-type
      const urlName = url.split('/').pop()?.split('?')[0] || 'image'
      const ext = urlName.includes('.') ? urlName.split('.').pop() || 'png' : 'png'

      // Show save dialog
      const result = await dialog.showSaveDialog(win, {
        defaultPath: urlName,
        filters: [{ name: 'Images', extensions: [ext] }],
      })

      if (result.canceled || !result.filePath) {
        return { success: false, canceled: true }
      }

      writeFileSync(result.filePath, buffer)
      return { success: true, path: result.filePath }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })
}
