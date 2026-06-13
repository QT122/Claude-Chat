import { useState } from 'react'
import { useSettingsStore } from '../../stores/settings-store'
import { Key, Eye, EyeOff, Check, X, Trash2 } from 'lucide-react'
import type { ProviderType } from '../../../preload/index'

interface Props {
  onSaved: () => void
}

export default function ApiKeyTab({ onSaved }: Props) {
  const {
    provider,
    apiKeyConfigured, apiKeyValid,
    deepseekConfigured, deepseekValid,
    openaiConfigured, openaiValid,
    byteplusConfigured, byteplusValid, byteplusError,
    checkApiKey, setApiKey, clearApiKey,
    checkDeepseekKey, setDeepseekKey, clearDeepseekKey,
    checkOpenAIKey, setOpenAIKey, clearOpenAIKey,
    checkByteplusKey, setByteplusKey, clearByteplusKey,
  } = useSettingsStore()

  return (
    <div className="space-y-6">
      {/* Anthropic Key */}
      <ProviderKeySection
        provider="anthropic"
        label="Anthropic API Key"
        placeholder="sk-ant-api03-..."
        configured={apiKeyConfigured}
        valid={apiKeyValid}
        onTest={(key) => checkApiKey(key)}
        onSave={(key) => { setApiKey(key); onSaved() }}
        onClear={clearApiKey}
        isActive={provider === 'anthropic'}
      />

      <div className="border-t border-gray-800" />

      {/* DeepSeek Key */}
      <ProviderKeySection
        provider="deepseek"
        label="DeepSeek API Key"
        placeholder="sk-..."
        configured={deepseekConfigured}
        valid={deepseekValid}
        onTest={(key) => checkDeepseekKey(key)}
        onSave={(key) => { setDeepseekKey(key); onSaved() }}
        onClear={clearDeepseekKey}
        isActive={provider === 'deepseek'}
      />

      <div className="border-t border-gray-800" />

      {/* BytePlus Key (Vision + Image/Video Gen) */}
      <ProviderKeySection
        provider="byteplus"
        label="BytePlus 火山方舟 API Key（识图 + 生图 + 生视频）"
        placeholder="请输入火山方舟 API Key..."
        configured={byteplusConfigured}
        valid={byteplusValid}
        error={byteplusError}
        onTest={(key) => checkByteplusKey(key)}
        onSave={(key) => { setByteplusKey(key); onSaved() }}
        onClear={clearByteplusKey}
        isActive={false}
      />

      <div className="border-t border-gray-800" />

      {/* OpenAI Key (for DALL-E) */}
      <ProviderKeySection
        provider="openai"
        label="OpenAI API Key（DALL-E 生图）"
        placeholder="sk-proj-..."
        configured={openaiConfigured}
        valid={openaiValid}
        onTest={(key) => checkOpenAIKey(key)}
        onSave={(key) => { setOpenAIKey(key); onSaved() }}
        onClear={clearOpenAIKey}
        isActive={false}
      />
    </div>
  )
}

function ProviderKeySection({
  label,
  placeholder,
  configured,
  valid,
  error,
  onTest,
  onSave,
  onClear,
  isActive,
}: {
  provider: ProviderType
  label: string
  placeholder: string
  configured: boolean
  valid: boolean | null
  error?: string | null
  onTest: (key: string) => Promise<void>
  onSave: (key: string) => Promise<void>
  onClear: () => Promise<void>
  isActive: boolean
}) {
  const [key, setKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleTest = async () => {
    if (!key.trim()) return
    setTesting(true)
    await onTest(key.trim())
    setTesting(false)
  }

  const handleSave = async () => {
    if (!key.trim()) return
    setSaving(true)
    await onSave(key.trim())
    setKey('')
    setSaving(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-gray-300">
        <Key size={16} />
        <span className="font-medium">{label}</span>
        {isActive && <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-900/50 text-violet-300">使用中</span>}
        {valid === true && (
          <span className="flex items-center gap-1 text-green-400 text-xs">
            <Check size={12} /> 已配置
          </span>
        )}
        {valid === false && (
          <span className="flex items-center gap-1 text-red-400 text-xs">
            <X size={12} /> 无效
          </span>
        )}
        {error && (
          <p className="text-red-400/80 text-xs mt-1 break-all">{error}</p>
        )}
      </div>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type={showKey ? 'text' : 'password'}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder={configured ? '••••••••（已配置）' : placeholder}
            className="w-full bg-gray-800 text-sm text-gray-200 placeholder-gray-500 rounded-lg px-3 py-2 pr-9 border border-gray-700 focus:border-violet-500 outline-none"
          />
          <button
            onClick={() => setShowKey(!showKey)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
          >
            {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleTest}
          disabled={!key.trim() || testing}
          className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-gray-200 rounded-lg transition-colors"
        >
          {testing ? '测试中...' : '测试连接'}
        </button>
        <button
          onClick={handleSave}
          disabled={!key.trim() || saving}
          className="px-3 py-1.5 text-xs bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-lg transition-colors"
        >
          {saving ? '保存中...' : '保存'}
        </button>
        {configured && (
          <button
            onClick={onClear}
            className="px-3 py-1.5 text-xs bg-red-900/50 hover:bg-red-800 text-red-300 rounded-lg transition-colors flex items-center gap-1"
          >
            <Trash2 size={12} />
            清除
          </button>
        )}
      </div>
    </div>
  )
}
