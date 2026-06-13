import { useEffect, useState } from 'react'
import { X, Plus, Trash2, Brain, Edit3, User, Bookmark, FolderGit2, FileText } from 'lucide-react'
import { useMemoryStore } from '../../stores/memory-store'
import { useUIStore } from '../../stores/ui-store'
import MemoryEditor from './MemoryEditor'
import type { Memory } from '../../types/message'

const typeIcons: Record<string, React.ReactNode> = {
  user: <User size={12} />,
  feedback: <Bookmark size={12} />,
  project: <FolderGit2 size={12} />,
  reference: <FileText size={12} />,
}

const typeNames: Record<string, string> = {
  user: '用户',
  feedback: '反馈',
  project: '项目',
  reference: '参考',
}

function MemoryItem({ mem, onEdit, onDelete }: { mem: Memory; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="group bg-gray-800/50 rounded-lg px-3 py-2 border border-gray-700/50 hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-sm text-gray-200 font-medium truncate">{mem.title}</div>
          <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{mem.content}</div>
          {(mem as any).conversationId && (
            <div className="text-[10px] text-gray-600 mt-1">
              来自对话: {(mem as any).conversationId.slice(0, 8)}...
            </div>
          )}
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button onClick={onEdit} className="p-1 hover:bg-gray-700 rounded text-gray-600 hover:text-violet-400">
            <Edit3 size={12} />
          </button>
          <button onClick={onDelete} className="p-1 hover:bg-red-800/50 rounded text-gray-600 hover:text-red-400" title="删除记忆">
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MemoryPanel() {
  const open = useUIStore((s) => s.memoryPanelOpen)
  const setOpen = useUIStore((s) => s.setMemoryPanelOpen)
  const { memories, editingMemory, loadMemories, saveMemory, deleteMemory, setEditingMemory } = useMemoryStore()
  const [showEditor, setShowEditor] = useState(false)

  useEffect(() => {
    if (open) loadMemories()
  }, [open, loadMemories])

  const handleSave = (mem: Memory) => {
    saveMemory(mem)
    setShowEditor(false)
    setEditingMemory(null)
  }

  if (!open) return null

  const grouped: Record<string, typeof memories> = {}
  for (const m of memories) {
    const t = m.type || 'user'
    if (!grouped[t]) grouped[t] = []
    grouped[t].push(m)
  }

  return (
    <>
      <div className="fixed inset-0 z-40 flex justify-end">
        <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
        <div className="relative w-96 bg-gray-900 border-l border-gray-700 h-full flex flex-col shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <Brain size={16} className="text-violet-400" />
              <h3 className="text-sm font-medium text-gray-200">记忆管理</h3>
              <span className="text-[10px] text-gray-600">AI 自动记录</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => { setEditingMemory(null); setShowEditor(true) }}
                className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
                title="新建记忆"
              >
                <Plus size={16} />
              </button>
              <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {memories.length === 0 ? (
              <div className="text-center text-sm text-gray-500 py-12">
                <Brain size={32} className="mx-auto mb-3 text-gray-700" />
                <p>暂无记忆</p>
                <p className="text-xs mt-1 text-gray-600">AI 会在对话中自动保存重要信息</p>
              </div>
            ) : (
              Object.entries(grouped).map(([type, items]) => (
                <div key={type}>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1.5 px-1">
                    {typeIcons[type] || <FileText size={12} />}
                    <span>{typeNames[type] || type}</span>
                    <span className="text-gray-700">({items.length})</span>
                  </div>
                  <div className="space-y-1">
                    {items.map((mem) => (
                      <MemoryItem
                        key={mem.id}
                        mem={mem}
                        onEdit={() => { setEditingMemory(mem); setShowEditor(true) }}
                        onDelete={() => deleteMemory(mem.id)}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showEditor && (
        <MemoryEditor
          memory={editingMemory}
          onSave={handleSave}
          onClose={() => { setShowEditor(false); setEditingMemory(null) }}
        />
      )}
    </>
  )
}
