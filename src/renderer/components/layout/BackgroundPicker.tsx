import { useState } from 'react'
import { Image, Check, X } from 'lucide-react'
import { useUIStore } from '../../stores/ui-store'

export default function BackgroundPicker() {
  const backgroundImage = useUIStore((s) => s.backgroundImage)
  const setBackgroundImage = useUIStore((s) => s.setBackgroundImage)
  const [preview, setPreview] = useState<string | null>(null)
  const [prevBg, setPrevBg] = useState<string | null>(null)

  const handlePick = async () => {
    const result = await window.api.pickImage()
    if (result.dataUrl) {
      setPrevBg(backgroundImage)
      setPreview(result.dataUrl)
      setBackgroundImage(result.dataUrl) // preview
    }
  }

  const handleConfirm = () => {
    if (preview) {
      setBackgroundImage(preview, true) // persist to disk
    }
    setPreview(null)
    setPrevBg(null)
  }

  const handleCancel = () => {
    setBackgroundImage(prevBg)
    setPreview(null)
    setPrevBg(null)
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handlePick}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
        title="更换背景图片"
      >
        <Image size={14} />
        <span>背景</span>
      </button>

      {preview && (
        <div className="flex items-center gap-1 bg-gray-800 rounded-lg px-1">
          <button
            onClick={handleConfirm}
            className="p-1 text-green-400 hover:bg-green-900/30 rounded"
            title="确认更换"
          >
            <Check size={14} />
          </button>
          <button
            onClick={handleCancel}
            className="p-1 text-red-400 hover:bg-red-900/30 rounded"
            title="取消"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
