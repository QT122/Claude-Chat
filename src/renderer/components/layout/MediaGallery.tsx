import { useState, useEffect, useCallback } from 'react'
import { X, Download, Trash2, Image as ImageIcon } from 'lucide-react'

interface MediaInfo {
  id: string
  filename: string
  prompt: string
  type: 'image' | 'video'
  createdAt: number
  downloaded: boolean
}

interface Props {
  open: boolean
  onClose: () => void
}

export default function MediaGallery({ open, onClose }: Props) {
  const [media, setMedia] = useState<MediaInfo[]>([])
  const [dataUrls, setDataUrls] = useState<Record<string, string>>({})

  const loadMedia = useCallback(async () => {
    const result = await window.api.listMedia()
    setMedia(result.media)
    // Load data URLs on demand
    for (const item of result.media) {
      if (!dataUrls[item.filename]) {
        const urlResult = await window.api.getMediaDataUrl(item.filename)
        if (urlResult.dataUrl) {
          setDataUrls((prev) => ({ ...prev, [item.filename]: urlResult.dataUrl! }))
        }
      }
    }
  }, [])

  useEffect(() => {
    if (open) loadMedia()
  }, [open, loadMedia])

  const handleDownload = async (filename: string) => {
    const dataUrl = dataUrls[filename]
    if (dataUrl) {
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      await window.api.markDownloaded(filename)
      loadMedia()
    }
  }

  const handleDelete = async (filename: string) => {
    await window.api.deleteMedia(filename)
    loadMedia()
  }

  const formatDate = (ts: number) => {
    const d = new Date(ts)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const hours = Math.floor(diff / 3600000)
    if (hours < 1) return '刚刚'
    if (hours < 24) return `${hours} 小时前`
    const days = Math.floor(hours / 24)
    if (days < 3) return `${days} 天前`
    return d.toLocaleDateString('zh-CN')
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative w-96 h-full bg-gray-950 border-l border-gray-800 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-gray-950 border-b border-gray-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon size={18} className="text-violet-400" />
            <h2 className="text-sm font-medium text-gray-200">已生成图片</h2>
            <span className="text-xs text-gray-500">({media.length})</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
            <X size={18} />
          </button>
        </div>

        {media.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            还没有生成过图片
          </div>
        ) : (
          <div className="p-3 space-y-3">
            {media.map((item) => (
              <div key={item.id} className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
                {dataUrls[item.filename] ? (
                  <img
                    src={dataUrls[item.filename]}
                    alt={item.prompt}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-800 flex items-center justify-center">
                    <span className="text-gray-600 text-xs">加载中...</span>
                  </div>
                )}
                <div className="p-2 space-y-1">
                  <p className="text-xs text-gray-300 truncate">{item.prompt}</p>
                  <p className="text-[10px] text-gray-600">{formatDate(item.createdAt)}</p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleDownload(item.filename)}
                      className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300"
                    >
                      <Download size={12} /> 下载
                    </button>
                    <button
                      onClick={() => handleDelete(item.filename)}
                      className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={12} /> 删除
                    </button>
                    {item.downloaded && (
                      <span className="text-[10px] text-green-500 ml-auto">已下载 · 永久保留</span>
                    )}
                    {!item.downloaded && (
                      <span className="text-[10px] text-gray-600 ml-auto">3天后自动删除</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
