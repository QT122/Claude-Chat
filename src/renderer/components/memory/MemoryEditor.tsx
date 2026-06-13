import { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'
import type { Memory } from '../../types/message'

interface Props {
  memory: Memory | null
  onSave: (mem: Memory) => void
  onClose: () => void
}

export default function MemoryEditor({ memory, onSave, onClose }: Props) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [type, setType] = useState<Memory['type']>('user')

  useEffect(() => {
    if (memory) {
      setTitle(memory.title)
      setContent(memory.content)
      setType(memory.type)
    } else {
      setTitle('')
      setContent('')
      setType('user')
    }
  }, [memory])

  const handleSave = () => {
    onSave({
      id: memory?.id || crypto.randomUUID(),
      title: title.trim() || '未命名记忆',
      content: content.trim(),
      type,
      createdAt: memory?.createdAt || Date.now(),
      updatedAt: Date.now(),
    })
    onClose()
  }

  const typeLabels: Array<{ value: Memory['type']; label: string }> = [
    { value: 'user', label: '用户信息' },
    { value: 'feedback', label: '反馈记录' },
    { value: 'project', label: '项目信息' },
    { value: 'reference', label: '参考资料' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
          <h3 className="text-sm font-medium text-gray-200">
            {memory ? '编辑记忆' : '新建记忆'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">标题</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-violet-500"
              placeholder="记忆标题..."
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">内容</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-violet-500 resize-none"
              placeholder="记忆内容..."
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">类型</label>
            <div className="flex gap-2 flex-wrap">
              {typeLabels.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    type === t.value
                      ? 'bg-violet-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!content.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors"
          >
            <Save size={12} />
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
