import { useState, useEffect, useRef } from 'react'
import { Minus, Square, Copy, X, Settings, Brain, Zap, Image, User, Check } from 'lucide-react'
import { useUIStore } from '../../stores/ui-store'
import { useModeStore } from '../../stores/mode-store'
import ModeToggle from './ModeToggle'
import BackgroundPicker from './BackgroundPicker'
import MediaGallery from './MediaGallery'
import UsageIndicator from './UsageIndicator'
import WeatherDisplay from './WeatherDisplay'

interface Props {
  onSettingsClick: () => void
}

export default function TitleBar({ onSettingsClick }: Props) {
  const [isMaxed, setIsMaxed] = useState(false)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const nameInputRef = useRef<HTMLInputElement>(null)
  const setMemoryPanelOpen = useUIStore((s) => s.setMemoryPanelOpen)
  const setSkillsPanelOpen = useUIStore((s) => s.setSkillsPanelOpen)
  const avatarImage = useUIStore((s) => s.avatarImage)
  const avatarPreview = useUIStore((s) => s.avatarPreview)
  const pickAvatarPreview = useUIStore((s) => s.pickAvatarPreview)
  const confirmAvatar = useUIStore((s) => s.confirmAvatar)
  const cancelAvatar = useUIStore((s) => s.cancelAvatar)
  const displayName = useUIStore((s) => s.displayName)
  const setDisplayName = useUIStore((s) => s.setDisplayName)

  useEffect(() => {
    window.api.isMaximized().then(setIsMaxed).catch(() => {})
  }, [])

  const startEditName = () => {
    setNameDraft(displayName)
    setEditingName(true)
    setTimeout(() => nameInputRef.current?.select(), 10)
  }

  const saveName = () => {
    if (nameDraft.trim()) {
      setDisplayName(nameDraft.trim())
    }
    setEditingName(false)
  }

  return (
    <div
      className="h-10 bg-gray-900 flex items-center justify-between select-none border-b border-gray-800"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex items-center gap-2 pl-2">
        <button
          onClick={pickAvatarPreview}
          className="w-7 h-7 rounded-full overflow-hidden border border-gray-700 hover:border-violet-500 transition-colors flex items-center justify-center bg-gray-800 cursor-pointer flex-shrink-0"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          title="点击更换头像"
        >
          {avatarImage ? (
            <img src={avatarImage} alt="头像" className="w-full h-full object-cover" />
          ) : (
            <User size={14} className="text-gray-500" />
          )}
        </button>

        {avatarPreview && (
          <div className="flex items-center gap-0.5" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
            <button
              onClick={confirmAvatar}
              className="p-0.5 text-green-400 hover:bg-green-900/30 rounded"
              title="确认更换头像"
            >
              <Check size={12} />
            </button>
            <button
              onClick={cancelAvatar}
              className="p-0.5 text-red-400 hover:bg-red-900/30 rounded"
              title="取消"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {editingName ? (
          <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
            <input
              ref={nameInputRef}
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') { setEditingName(false) } }}
              className="bg-gray-800 border border-violet-500 rounded px-1.5 py-0 text-xs text-gray-200 outline-none w-32"
            />
            <button onClick={saveName} className="text-green-400 hover:text-green-300"><Check size={12} /></button>
            <button onClick={() => setEditingName(false)} className="text-red-400 hover:text-red-300"><X size={12} /></button>
          </div>
        ) : (
          <span
            className="text-xs font-medium text-gray-400 tracking-wide cursor-pointer hover:text-gray-200 transition-colors"
            onClick={startEditName}
            title="点击修改名称"
          >
            {displayName}
          </span>
        )}

        <div style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <ModeToggle />
        </div>
      </div>
      <div className="flex items-center" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <BackgroundPicker />
        <WeatherDisplay />
        <UsageIndicator />
        <button
          onClick={() => setMemoryPanelOpen(true)}
          className="h-10 w-10 flex items-center justify-center hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          title="记忆管理"
        >
          <Brain size={14} />
        </button>
        <button
          onClick={() => setSkillsPanelOpen(true)}
          className="h-10 w-10 flex items-center justify-center hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          title="技能管理"
        >
          <Zap size={14} />
        </button>
        <button
          onClick={() => setGalleryOpen(true)}
          className="h-10 w-10 flex items-center justify-center hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          title="已生成图片"
        >
          <Image size={14} />
        </button>
        <button
          onClick={onSettingsClick}
          className="h-10 w-10 flex items-center justify-center hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          title="设置"
        >
          <Settings size={14} />
        </button>
        <button
          onClick={() => window.api.minimize()}
          className="h-10 w-10 flex items-center justify-center hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          title="最小化"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={() => window.api.maximize()}
          className="h-10 w-10 flex items-center justify-center hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          title={isMaxed ? '还原' : '最大化'}
        >
          {isMaxed ? <Copy size={12} strokeWidth={2.5} /> : <Square size={12} />}
        </button>
        <button
          onClick={() => window.api.close()}
          className="h-10 w-10 flex items-center justify-center hover:bg-red-600 text-gray-400 hover:text-white transition-colors"
          title="关闭"
        >
          <X size={14} />
        </button>
      </div>
      <MediaGallery open={galleryOpen} onClose={() => setGalleryOpen(false)} />
    </div>
  )
}
