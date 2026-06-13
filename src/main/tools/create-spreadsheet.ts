import { BrowserWindow, dialog } from 'electron'
import { writeFileSync } from 'fs'
import ExcelJS from 'exceljs'
import type { ToolDefinition } from './base'

export const createSpreadsheetTool: ToolDefinition = {
  name: 'create_spreadsheet',
  displayName: '生成 Excel',
  description: 'Create an Excel (.xlsx) spreadsheet. Provide a title, column headers, and rows of data. The user will be prompted to save the file.',
  inputSchema: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Spreadsheet title (used as filename)' },
      sheetName: { type: 'string', description: 'Sheet/tab name' },
      headers: { type: 'array', items: { type: 'string' }, description: 'Column header names' },
      rows: {
        type: 'array',
        items: { type: 'array', items: { type: 'string' } },
        description: 'Data rows, each row is an array of cell values',
      },
    },
    required: ['title', 'headers', 'rows'],
  },

  async execute(input) {
    const title = (input.title as string)?.trim()
    const sheetName = ((input.sheetName as string) || 'Sheet1').trim()
    const headers = (input.headers as string[]) || []
    const rows = (input.rows as string[][]) || []

    if (!title || headers.length === 0) {
      return { content: '请提供表格标题和列头', isError: true }
    }

    try {
      const workbook = new ExcelJS.Workbook()
      workbook.creator = 'Claude Chat'

      const sheet = workbook.addWorksheet(sheetName)

      // Header row
      const headerRow = sheet.addRow(headers)
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 }
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2B3674' },
      }
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' }
      headerRow.height = 28
      headerRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' }, bottom: { style: 'thin' },
          left: { style: 'thin' }, right: { style: 'thin' },
        }
      })

      // Data rows
      for (const row of rows) {
        const dataRow = sheet.addRow(row)
        dataRow.eachCell((cell, colNum) => {
          cell.alignment = { vertical: 'middle' }
          cell.border = {
            top: { style: 'thin' }, bottom: { style: 'thin' },
            left: { style: 'thin' }, right: { style: 'thin' },
          }
          // Zebra striping
          if (dataRow.number % 2 === 0) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5FF' } }
          }
        })
      }

      // Auto-fit column widths
      sheet.columns.forEach((col, i) => {
        const values = [headers[i], ...rows.map(r => r[i] || '')]
        const maxLen = Math.max(...values.map(v => String(v).length))
        col.width = Math.min(Math.max(maxLen * 2.2, 10), 40)
      })

      const buffer = await workbook.xlsx.writeBuffer() as Buffer

      const win = BrowserWindow.getAllWindows()[0]
      if (!win) return { content: '无法打开保存对话框', isError: true }

      const result = await dialog.showSaveDialog(win, {
        defaultPath: `${title}.xlsx`,
        filters: [{ name: 'Excel 工作簿', extensions: ['xlsx'] }],
      })

      if (result.canceled || !result.filePath) {
        return { content: '已取消保存' }
      }

      writeFileSync(result.filePath, buffer)
      return {
        content: `Excel 已保存到: ${result.filePath}\n包含 ${headers.length} 列, ${rows.length} 行数据。`,
        metadata: { path: result.filePath, columns: headers.length, rows: rows.length },
      }
    } catch (err) {
      return { content: `生成表格失败: ${err instanceof Error ? err.message : String(err)}`, isError: true }
    }
  },
}
