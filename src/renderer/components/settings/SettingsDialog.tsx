import { useState } from 'react'
import { X, Key, FolderOpen, Cpu, Zap } from 'lucide-react'
import ApiKeyTab from './ApiKeyTab'
import ProjectTab from './ProjectTab'
import ModelSelect from './ModelSelect'
import { useSettingsStore } from '../../stores/settings-store'
import type { ProviderType } from '../../../preload/index'

interface Props {
  open: boolean
  onClose: () => void
}

type Tab = 'api-key' | 'model' | 'provider' | 'project'

export default function SettingsDialog({ open, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('api-key')
  const { provider, setProvider } = useSettingsStore()

  if (!open) return null

  const tabs = [
    { id: 'api-key' as Tab, icon: <Key size={12} />, label: 'API Key' },
    { id: 'provider' as Tab, icon: <Zap size={12} />, label: '提供商' },
    { id: 'model' as Tab, icon: <Cpu size={12} />, label: '模型' },
    { id: 'project' as Tab, icon: <FolderOpen size={12} />, label: '项目' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
          <h2 className="text-sm font-medium text-gray-200">设置</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex border-b border-gray-800 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-violet-400 border-violet-400'
                  : 'text-gray-500 border-transparent hover:text-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === 'api-key' && <ApiKeyTab onSaved={onClose} />}
          {activeTab === 'provider' && <ProviderTab provider={provider} setProvider={setProvider} />}
          {activeTab === 'model' && <ModelSelect />}
          {activeTab === 'project' && <ProjectTab />}
        </div>
      </div>
    </div>
  )
}

function ProviderTab({ provider, setProvider }: { provider: ProviderType; setProvider: (p: ProviderType) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-gray-300">
        <Zap size={16} />
        <span className="font-medium">API 提供商</span>
      </div>

      <p className="text-xs text-gray-500">选择当前使用的 AI API 提供商。请确保对应的 API Key 已在上一 Tab 中配置。</p>

      <div className="space-y-1">
        <button
          onClick={() => setProvider('anthropic')}
          className={`w-full text-left px-3 py-3 rounded-lg transition-colors ${
            provider === 'anthropic'
              ? 'bg-violet-900/30 border border-violet-700/50'
              : 'bg-gray-800 border border-transparent hover:bg-gray-700'
          }`}
        >
          <div className="text-sm font-medium text-gray-200">Anthropic (Claude)</div>
          <div className="text-xs text-gray-500 mt-0.5">Claude Sonnet 4, Opus 4, Haiku 4.5 — 原生工具调用支持</div>
        </button>

        <button
          onClick={() => setProvider('deepseek')}
          className={`w-full text-left px-3 py-3 rounded-lg transition-colors ${
            provider === 'deepseek'
              ? 'bg-violet-900/30 border border-violet-700/50'
              : 'bg-gray-800 border border-transparent hover:bg-gray-700'
          }`}
        >
          <div className="text-sm font-medium text-gray-200">DeepSeek</div>
          <div className="text-xs text-gray-500 mt-0.5">DeepSeek V3, R1 — OpenAI 兼容 API，高性价比</div>
        </button>
      </div>
    </div>
  )
}
