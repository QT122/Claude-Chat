import { useCallback, useState } from 'react'
import { Download, Trash2, Check } from 'lucide-react'
import type { MediaItem } from '../../types/message'

interface Props {
  item: MediaItem
}

export default function MediaDisplay({ item }: Props) {
  const [downloaded, setDownloaded] = useState(item.downloaded)

  const handleDownload = useCallback(async () => {
    if (item.type === 'image') {
      // Create an anchor to download the data URL
      const a = document.createElement('a')
      a.href = item.dataUrl
      a.download = item.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setDownloaded(true)
      window.api.markDownloaded(item.filename)
    }
  }, [item])

  return (
    <div className="my-3 rounded-xl overflow-hidden bg-gray-900/60 border border-gray-800 group">
      {item.type === 'image' ? (
        <img
          src={item.dataUrl}
          alt={item.prompt}
          className="max-w-full max-h-[500px] object-contain mx-auto"
        />
      ) : (
        <video
          src={item.dataUrl}
          controls
          className="max-w-full max-h-[500px] mx-auto"
        />
      )}
      <div className="flex items-center justify-between px-3 py-2 bg-black/30">
        <span className="text-xs text-gray-400 truncate flex-1">{item.prompt}</span>
        <div className="flex items-center gap-2 flex-shrink-0">
          {downloaded ? (
            <span className="text-xs text-green-400 flex items-center gap-1">
              <Check size={12} /> 已下载
            </span>
          ) : (
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              <Download size={14} />
              下载
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
