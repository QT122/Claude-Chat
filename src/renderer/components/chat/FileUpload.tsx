import { useState, useRef, useCallback } from 'react'
import { Paperclip, X } from 'lucide-react'
import type { FileAttachment } from '../../types/message'
import FilePreview from './FilePreview'

export default function FileUpload() {
  const [files, setFiles] = useState<FileAttachment[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const handlePick = async () => {
    const result = await window.api.pickFiles()
    if (!result.canceled && result.files.length > 0) {
      setFiles((prev) => [...prev, ...result.files])
    }
  }

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const clearFiles = useCallback(() => {
    setFiles([])
  }, [])

  return (
    <div>
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {files.map((f) => (
            <FilePreview key={f.id} file={f} onRemove={() => removeFile(f.id)} />
          ))}
        </div>
      )}
      <div className="flex items-center gap-1">
        <button
          onClick={handlePick}
          className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-lg transition-colors"
          title="上传文件"
        >
          <Paperclip size={16} />
        </button>
        {files.length > 0 && (
          <button
            onClick={clearFiles}
            className="p-1 text-red-400 hover:text-red-300 transition-colors"
            title="清除所有文件"
          >
            <X size={12} />
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={async (e) => {
          // Handled via pickFiles dialog
        }}
      />
    </div>
  )
}

export { FileUpload }
export type { FileAttachment }
