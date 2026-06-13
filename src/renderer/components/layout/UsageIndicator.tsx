import { useState, useEffect, useCallback } from 'react'
import { DollarSign, Loader2, Eye, EyeOff, Check, X, AlertCircle } from 'lucide-react'
import type { ByteplusUsageData } from '../../../preload/index'

interface UsageData {
  deepseek: { balance: string; currency: string } | null
  byteplus: { available: boolean; usage: ByteplusUsageData | null; error?: string } | null
}

export default function UsageIndicator() {
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)

  // BytePlus AK/SK state
  const [akConfigured, setAkConfigured] = useState(false)
  const [ak, setAk] = useState('')
  const [sk, setSk] = useState('')
  const [showSk, setShowSk] = useState(false)
  const [akskSaving, setAkskSaving] = useState(false)
  const [queryLoading, setQueryLoading] = useState(false)
  const [queryError, setQueryError] = useState('')

  const fetchUsage = useCallback(async () => {
    setLoading(true)
    try {
      const result = await window.api.getUsage()
      setUsage(result)
    } catch {
      // ignore
    }
    setLoading(false)
  }, [])

  const loadAKSK = useCallback(async () => {
    try {
      const result = await window.api.getByteplusAKSK()
      setAkConfigured(result.configured)
      if (result.ak) setAk(result.ak)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    fetchUsage()
    loadAKSK()
  }, [fetchUsage, loadAKSK])

  const saveAKSK = async () => {
    if (!ak.trim() || !sk.trim()) return
    setAkskSaving(true)
    setQueryError('')
    const saveResult = await window.api.saveByteplusAKSK(ak.trim(), sk.trim())
    if (saveResult.success) {
      setAkConfigured(true)
      // Directly query with the fresh AK/SK
      setQueryLoading(true)
      const qResult = await window.api.queryByteplusUsage(ak.trim(), sk.trim())
      if (qResult.success && qResult.usage) {
        setUsage((prev) => ({
          ...prev,
          deepseek: prev?.deepseek || null,
          byteplus: { available: true, usage: qResult.usage! },
        }))
        setQueryError('')
      } else {
        setQueryError(qResult.error || '查询失败')
      }
      setQueryLoading(false)
    } else {
      setQueryError(saveResult.error || '保存失败')
    }
    setAkskSaving(false)
  }

  const clearAKSK = async () => {
    await window.api.clearByteplusAKSK()
    setAkConfigured(false)
    setAk('')
    setSk('')
    setQueryError('')
    setUsage(null)
    fetchUsage()
  }

  const queryUsage = async () => {
    if (!ak.trim() || !sk.trim()) return
    setQueryLoading(true)
    setQueryError('')
    const result = await window.api.queryByteplusUsage(ak.trim(), sk.trim())
    if (result.success && result.usage) {
      setUsage((prev) => ({
        ...prev,
        deepseek: prev?.deepseek || null,
        byteplus: { available: true, usage: result.usage! },
      }))
      setQueryError('')
    } else {
      setQueryError(result.error || '查询失败，请检查 AK/SK 是否正确，以及是否已开通计费权限')
    }
    setQueryLoading(false)
  }

  // Also show byteplus error from auto-fetch
  const autoError = usage?.byteplus?.error

  if (!usage && !akConfigured) return null

  const byteplusUsage = usage?.byteplus?.usage

  return (
    <div className="relative" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
      <button
        onClick={() => { setExpanded(!expanded); if (!expanded) fetchUsage() }}
        className="h-10 flex items-center gap-1 px-2 text-xs text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
        title="用量 & 余额"
      >
        {loading ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <DollarSign size={12} className="text-green-400" />
        )}
        {usage?.deepseek && (
          <span className="text-gray-300">{usage.deepseek.balance}</span>
        )}
      </button>

      {expanded && (
        <div className="absolute right-0 top-10 w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-3 space-y-3 z-50 max-h-96 overflow-y-auto">
          {/* DeepSeek */}
          {usage?.deepseek ? (
            <div>
              <div className="text-[10px] text-gray-500 uppercase mb-0.5">DeepSeek V4 Pro</div>
              <div className="text-sm text-gray-200 font-medium">
                余额: {usage.deepseek.balance} {usage.deepseek.currency}
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-500">DeepSeek: 未配置 API Key</div>
          )}

          <div className="border-t border-gray-800" />

          {/* Volcano Engine */}
          <div>
            <div className="text-[10px] text-gray-500 uppercase mb-0.5">火山方舟</div>
            {usage?.byteplus?.available ? (
              byteplusUsage ? (
                <div className="space-y-1">
                  <div className="text-sm text-green-400">
                    本月消费: ¥{byteplusUsage.totalSpend}
                  </div>
                  <div className="text-[10px] text-gray-500">{byteplusUsage.billPeriod}</div>
                  {byteplusUsage.details.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {byteplusUsage.details.slice(0, 8).map((d, i) => (
                        <div key={i} className="flex justify-between text-[10px] text-gray-400">
                          <span className="truncate max-w-[140px]">{d.product}</span>
                          <span className="flex-shrink-0">¥{d.amount}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={queryUsage}
                    disabled={queryLoading}
                    className="mt-1 text-[10px] text-violet-400 hover:text-violet-300 disabled:opacity-50"
                  >
                    {queryLoading ? '查询中...' : '刷新用量'}
                  </button>
                  {queryError && (
                    <div className="mt-1 flex items-start gap-1 text-[10px] text-red-400">
                      <AlertCircle size={10} className="flex-shrink-0 mt-0.5" />
                      <span>{queryError}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="text-sm text-green-400">API Key 已配置</div>

                  {/* AK/SK input */}
                  <div className="mt-2 space-y-1">
                    <input
                      type="text"
                      value={ak}
                      onChange={(e) => setAk(e.target.value)}
                      placeholder={akConfigured ? 'AK 已保存' : 'Access Key ID'}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-200 outline-none focus:border-violet-500"
                    />
                    <div className="relative">
                      <input
                        type={showSk ? 'text' : 'password'}
                        value={sk}
                        onChange={(e) => setSk(e.target.value)}
                        placeholder={akConfigured ? 'SK 已保存' : 'Secret Access Key'}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 pr-7 text-xs text-gray-200 outline-none focus:border-violet-500"
                      />
                      <button
                        onClick={() => setShowSk(!showSk)}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                      >
                        {showSk ? <EyeOff size={10} /> : <Eye size={10} />}
                      </button>
                    </div>

                    {(queryError || autoError) && (
                      <div className="flex items-start gap-1 text-[10px] text-red-400">
                        <AlertCircle size={10} className="flex-shrink-0 mt-0.5" />
                        <span>{queryError || autoError}</span>
                      </div>
                    )}

                    <div className="flex gap-1">
                      <button
                        onClick={saveAKSK}
                        disabled={!ak.trim() || !sk.trim() || akskSaving}
                        className="flex-1 px-2 py-1 text-[10px] bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded transition-colors flex items-center justify-center gap-1"
                      >
                        {akskSaving ? (
                          <Loader2 size={10} className="animate-spin" />
                        ) : (
                          <Check size={10} />
                        )}
                        {akskSaving ? '保存中...' : '保存并查询'}
                      </button>
                      {akConfigured && (
                        <button
                          onClick={clearAKSK}
                          className="px-2 py-1 text-[10px] bg-red-900/50 hover:bg-red-800 text-red-300 rounded"
                        >
                          <X size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className="text-xs text-gray-500">未配置 API Key</div>
            )}
          </div>
        </div>
      )}

      {expanded && (
        <div className="fixed inset-0 z-40" onClick={() => setExpanded(false)} />
      )}
    </div>
  )
}
