import { MessageSquare, FolderOpen } from 'lucide-react'
import { useModeStore, type AppMode } from '../../stores/mode-store'

export default function ModeToggle() {
  const mode = useModeStore((s) => s.mode)
  const setMode = useModeStore((s) => s.setMode)

  const modes: Array<{ id: AppMode; label: string; icon: React.ReactNode; desc: string }> = [
    { id: 'chat', label: '对话模式', icon: <MessageSquare size={16} />, desc: '纯文本对话' },
    { id: 'project', label: '项目模式', icon: <FolderOpen size={16} />, desc: '文件工具 + 代码协作' },
  ]

  return (
    <div className="flex bg-gray-800 rounded-lg p-0.5">
      {modes.map((m) => (
        <button
          key={m.id}
          onClick={() => setMode(m.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            mode === m.id
              ? 'bg-violet-600 text-white shadow-sm'
              : 'text-gray-400 hover:text-gray-200'
          }`}
          title={m.desc}
        >
          {m.icon}
          <span>{m.label}</span>
        </button>
      ))}
    </div>
  )
}
