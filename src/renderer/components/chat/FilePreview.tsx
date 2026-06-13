import { X, FileText, Image } from 'lucide-react'
import type { FileAttachment } from '../../types/message'

interface Props {
  file: FileAttachment
  onRemove: () => void
}

export default function FilePreview({ file, onRemove }: Props) {
  return (
    <div className="relative flex items-center gap-1.5 bg-gray-800 border border-gray-700 rounded-lg pl-2 pr-1 py-1">
      {file.isImage ? (
        <>
          <Image size={14} className="text-blue-400 flex-shrink-0" />
          {file.content && (
            <img
              src={`data:image/${file.type};base64,${file.content}`}
              alt={file.name}
              className="w-6 h-6 rounded object-cover flex-shrink-0"
            />
          )}
        </>
      ) : (
        <FileText size={14} className="text-gray-400 flex-shrink-0" />
      )}
      <span className="text-xs text-gray-300 truncate max-w-[100px]">{file.name}</span>
      <button
        onClick={onRemove}
        className="p-1 rounded hover:bg-red-800/50 text-gray-500 hover:text-red-400 transition-colors flex-shrink-0"
        title="移除文件"
      >
        <X size={12} />
      </button>
    </div>
  )
}
