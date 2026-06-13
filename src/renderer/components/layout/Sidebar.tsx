import { useEffect, useState, useRef } from 'react'
import { Plus, MessageSquare, Settings, Trash2, Edit3, Check, X } from 'lucide-react'
import { useConversationStore } from '../../stores/conversation-store'

interface ConvSummary {
  id: string
  title: string
  createdAt: number
  updatedAt: number
}

interface Props {
  onSettingsClick: () => void
}

export default function Sidebar({ onSettingsClick }: Props) {
  const [convos, setConvos] = useState<ConvSummary[]>([])
  const clearMessages = useConversationStore((s) => s.clearMessages)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const editRef = useRef<HTMLInputElement>(null)

  const loadList = async () => {
    try {
      const result = await window.api.listConversations('chat')
      setConvos(result.conversations || [])
    } catch {
      // API not ready
    }
  }

  useEffect(() => {
    loadList()
    // Refresh list every time sidebar might be opened
    const interval = setInterval(loadList, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleNewChat = () => {
    clearMessages()
    setActiveId(null)
  }

  const handleLoad = async (id: string) => {
    if (editingId) return
    try {
      const result = await window.api.loadConversation(id)
      if (result.conversation) {
        const conv = result.conversation as any
        useConversationStore.getState().clearMessages()
        useConversationStore.getState().setConversationId(id)

        for (const msg of conv.messages) {
          if (msg.mediaItems) {
            for (const item of msg.mediaItems) {
              if (!item.dataUrl && item.filename) {
                try {
                  const urlResult = await window.api.getMediaDataUrl(item.filename)
                  if (urlResult.dataUrl) item.dataUrl = urlResult.dataUrl
                } catch { /* skip */ }
              }
            }
          }
          useConversationStore.getState().addMessage(msg)
        }
        if (conv.title) {
          useConversationStore.getState().setTitle(conv.title)
        }
        setActiveId(id)
      }
    } catch {
      // ignore
    }
  }

  const confirmDelete = async (id: string) => {
    await window.api.deleteConversation(id)
    if (activeId === id) {
      clearMessages()
      setActiveId(null)
      useConversationStore.getState().setTitle('')
    }
    setDeletingId(null)
    loadList()
  }

  const startEdit = (e: React.MouseEvent, conv: ConvSummary) => {
    e.stopPropagation()
    setEditingId(conv.id)
    setEditTitle(conv.title)
    setTimeout(() => editRef.current?.focus(), 10)
  }

  const saveEdit = async (id: string) => {
    if (editTitle.trim()) {
      const conv = convos.find((c) => c.id === id)
      if (conv) {
        const full = await window.api.loadConversation(id)
        if (full.conversation) {
          await window.api.saveConversation({
            ...(full.conversation as any),
            title: editTitle.trim(),
          })
        }
      }
    }
    setEditingId(null)
    setEditTitle('')
    loadList()
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
  }

  const formatDate = (ts: number) => {
    const d = new Date(ts)
    const now = new Date()
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="h-full bg-gray-900 flex flex-col">
      <div className="p-3">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <Plus size={16} />
          <span>新对话</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        <div className="text-xs text-gray-500 px-3 py-2">对话历史</div>
        {convos.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-8">
            暂无对话记录
          </div>
        ) : (
          <div className="space-y-0.5">
            {convos.map((conv) => (
              <div
                key={conv.id}
                onClick={() => handleLoad(conv.id)}
                className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  activeId === conv.id
                    ? 'bg-violet-900/30 text-violet-200'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                }`}
              >
                <MessageSquare size={14} className="flex-shrink-0" />
                {editingId === conv.id ? (
                  <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      ref={editRef}
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(conv.id)
                        if (e.key === 'Escape') cancelEdit()
                      }}
                      className="flex-1 bg-gray-700 border border-violet-500 rounded px-1.5 py-0.5 text-xs text-gray-200 outline-none"
                    />
                    <button onClick={() => saveEdit(conv.id)} className="p-0.5 hover:bg-green-800/50 rounded text-green-400">
                      <Check size={12} />
                    </button>
                    <button onClick={cancelEdit} className="p-0.5 hover:bg-red-800/50 rounded text-red-400">
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-sm truncate flex-1">{conv.title}</span>
                    <span className="text-[10px] text-gray-600 flex-shrink-0">{formatDate(conv.updatedAt)}</span>
                  </>
                )}
                {!editingId && deletingId !== conv.id && (
                  <div className="flex items-center">
                    <button
                      onClick={(e) => startEdit(e, conv)}
                      className="p-0.5 hover:bg-gray-700 rounded text-gray-600 hover:text-violet-400 transition-colors"
                      title="重命名"
                    >
                      <Edit3 size={12} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeletingId(conv.id)
                      }}
                      className="p-0.5 hover:bg-red-800/50 rounded text-gray-600 hover:text-red-400 transition-colors"
                      title="删除"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
                {deletingId === conv.id && (
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[10px] text-red-400">确认删除?</span>
                    <button
                      onClick={() => confirmDelete(conv.id)}
                      className="px-1.5 py-0.5 text-[10px] bg-red-600 hover:bg-red-500 text-white rounded"
                    >
                      删除
                    </button>
                    <button
                      onClick={() => setDeletingId(null)}
                      className="px-1.5 py-0.5 text-[10px] bg-gray-700 hover:bg-gray-600 text-gray-300 rounded"
                    >
                      取消
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-800 space-y-1">
        <button
          onClick={onSettingsClick}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <Settings size={16} />
          <span>设置</span>
        </button>
      </div>
    </div>
  )
}
