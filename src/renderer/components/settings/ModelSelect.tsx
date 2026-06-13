import { useSettingsStore } from '../../stores/settings-store'
import { Cpu } from 'lucide-react'

const ANTHROPIC_MODELS = [
  { id: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4', desc: '快速、高性价比' },
  { id: 'claude-opus-4-20250514', label: 'Claude Opus 4', desc: '最强大推理能力' },
  { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5', desc: '极速轻量' },
]

const DEEPSEEK_MODELS = [
  { id: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro', desc: '最强旗舰模型' },
  { id: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash', desc: '快速高性价比' },
  { id: 'deepseek-chat', label: 'DeepSeek V3 (旧)', desc: '通用对话，即将弃用' },
  { id: 'deepseek-reasoner', label: 'DeepSeek R1 (旧)', desc: '深度推理，即将弃用' },
]

export default function ModelSelect() {
  const { model, setModel, provider } = useSettingsStore()
  const models = provider === 'deepseek' ? DEEPSEEK_MODELS : ANTHROPIC_MODELS

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-gray-300">
        <Cpu size={16} />
        <span className="font-medium">模型选择</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500">
          {provider === 'deepseek' ? 'DeepSeek' : 'Anthropic'}
        </span>
      </div>

      <div className="space-y-1">
        {models.map((m) => (
          <button
            key={m.id}
            onClick={() => setModel(m.id)}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
              model === m.id
                ? 'bg-violet-900/30 border border-violet-700/50 text-violet-200'
                : 'bg-gray-800 border border-transparent text-gray-400 hover:bg-gray-700 hover:text-gray-200'
            }`}
          >
            <div className="text-sm font-medium">{m.label}</div>
            <div className="text-xs text-gray-500">{m.desc}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
