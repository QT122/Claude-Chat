import { useState, useRef, useCallback, KeyboardEvent, DragEvent, ClipboardEvent } from 'react'
import { Send, Square, Paperclip } from 'lucide-react'
import { useConversationStore } from '../../stores/conversation-store'
import { useStreamingResponse } from '../../hooks/useStreamingResponse'
import type { FileAttachment } from '../../types/message'
import FilePreview from './FilePreview'

async function readFileForUpload(file: File): Promise<FileAttachment> {
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  const isImage = file.type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'].includes(ext)

  // Read file as base64
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  const base64 = btoa(binary)

  // Send to main process for parsing
  try {
    const result = await window.api.parseRaw({ name: file.name, data: base64, size: file.size })
    if (result.text) {
      return {
        id: crypto.randomUUID(),
        name: result.name || file.name,
        type: ext,
        size: result.size || file.size,
        content: result.text,
        isImage: result.isImage,
      }
    }
  } catch { /* fall through */ }

  // Fallback: just base64 content
  return {
    id: crypto.randomUUID(),
    name: file.name,
    type: ext,
    size: file.size,
    content: isImage ? base64 : `[无法读取: ${file.name}]`,
    isImage,
  }
}

export default function ChatInput() {
  const [text, setText] = useState('')
  const [files, setFiles] = useState<FileAttachment[]>([])
  const [dragOver, setDragOver] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isStreaming = useConversationStore((s) => s.isStreaming)
  const { send } = useStreamingResponse()

  const addFiles = useCallback(async (fileList: File[]) => {
    const attachments = await Promise.all(Array.from(fileList).map(readFileForUpload))
    setFiles((prev) => [...prev, ...attachments])
  }, [])

  const handlePickFiles = async () => {
    const result = await window.api.pickFiles()
    if (!result.canceled && result.files.length > 0) {
      const attachments = await Promise.all(
        result.files.map(async (f) => {
          // Already parsed by main process, just use the content
          return {
            id: crypto.randomUUID(),
            name: f.name,
            type: f.type,
            size: f.size,
            content: f.content,
            isImage: f.isImage,
          }
        })
      )
      setFiles((prev) => [...prev, ...attachments])
    }
  }

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const handlePaste = useCallback((e: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items
    if (!items) return
    const imageFiles: File[] = []
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile()
        if (file) imageFiles.push(file)
      }
    }
    if (imageFiles.length > 0) {
      e.preventDefault()
      addFiles(imageFiles)
    }
  }, [addFiles])

  const handleDragOver = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(true) }
  const handleDragLeave = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(false) }
  const handleDrop = (e: DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragOver(false)
    if (e.dataTransfer?.files?.length) addFiles(Array.from(e.dataTransfer.files))
  }

  const handleSend = useCallback(() => {
    const trimmed = text.trim()
    if ((!trimmed && files.length === 0) || isStreaming) return

    let sendText = trimmed || ''
    if (files.length > 0) {
      const fileTexts = files
        .filter((f) => !f.isImage && f.content)
        .map((f) => `[文件: ${f.name}]\n\`\`\`\n${f.content.slice(0, 50000)}\n\`\`\``)
      if (fileTexts.length > 0) {
        sendText = sendText ? `${sendText}\n\n${fileTexts.join('\n\n')}` : fileTexts.join('\n\n')
      }
      if (!sendText) sendText = '(发送了文件)'
    }
    if (!sendText.trim()) return

    setText('')
    const currentFiles = [...files]
    setFiles([])
    textareaRef.current?.focus()

    const imageFiles = currentFiles.filter((f) => f.isImage)
    send(sendText, imageFiles.length > 0 ? imageFiles : undefined)
  }, [text, files, isStreaming, send])

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <div className="mt-auto flex-shrink-0 border-t border-gray-800 px-4 py-2.5 bg-gray-950">
      <div className="max-w-3xl mx-auto">
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {files.map((f) => (
              <FilePreview key={f.id} file={f} onRemove={() => removeFile(f.id)} />
            ))}
          </div>
        )}
        {dragOver && (
          <div className="text-center text-xs text-violet-400 mb-2 py-4 border-2 border-dashed border-violet-500/50 rounded-xl bg-violet-500/5">
            释放以添加文件
          </div>
        )}
        <div
          onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
          className={`flex items-end gap-2 bg-gray-900 rounded-xl px-4 py-2 border transition-colors ${
            dragOver ? 'border-violet-400' : 'border-gray-700 focus-within:border-violet-500'
          }`}
        >
          <button onClick={handlePickFiles} className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0" title="上传文件">
            <Paperclip size={16} />
          </button>
          <textarea ref={textareaRef} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={handleKeyDown} onPaste={handlePaste}
            placeholder="输入消息... (Shift+Enter 换行，可粘贴图片/拖入文件)" rows={1}
            className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-500 resize-none outline-none py-1.5 max-h-32"
          />
          <button onClick={handleSend} disabled={(!text.trim() && files.length === 0) || isStreaming}
            className="p-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 disabled:text-gray-500 text-white transition-colors flex-shrink-0">
            {isStreaming ? <Square size={16} /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  )
}
