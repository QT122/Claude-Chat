import { useState, useEffect } from 'react'
import { X, Save, Code2, PenLine, BarChart3, BookOpen, Languages, ClipboardList, Presentation, Wrench } from 'lucide-react'
import type { Skill } from '../../types/message'

interface Props {
  skill: Skill | null
  onSave: (skill: Skill) => void
  onClose: () => void
}

const categoryIcons: Record<string, React.ReactNode> = {
  writing: <PenLine size={14} />,
  analysis: <BarChart3 size={14} />,
  development: <Code2 size={14} />,
  learning: <BookOpen size={14} />,
  other: <Wrench size={14} />,
}

export default function SkillEditor({ skill, onSave, onClose }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [category, setCategory] = useState<Skill['category']>('other')

  useEffect(() => {
    if (skill) {
      setName(skill.name)
      setDescription(skill.description)
      setSystemPrompt(skill.systemPrompt)
      setCategory(skill.category)
    }
  }, [skill])

  const handleSave = () => {
    if (!skill) return
    onSave({
      ...skill,
      name: name.trim() || skill.name,
      description: description.trim() || skill.description,
      systemPrompt: systemPrompt.trim() || skill.systemPrompt,
      category,
      updatedAt: Date.now(),
    })
    onClose()
  }

  if (!skill) return null

  const categories: Array<{ value: Skill['category']; label: string }> = [
    { value: 'writing', label: '写作' },
    { value: 'analysis', label: '分析' },
    { value: 'development', label: '开发' },
    { value: 'learning', label: '学习' },
    { value: 'other', label: '其他' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-2xl shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800 flex-shrink-0">
          <h3 className="text-sm font-medium text-gray-200">
            编辑技能: {skill.name}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">技能名称</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">分类</label>
              <div className="flex gap-1 flex-wrap">
                {categories.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setCategory(c.value)}
                    className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                      category === c.value
                        ? 'bg-violet-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {categoryIcons[c.value]}
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">描述</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-violet-500"
              placeholder="简短描述技能功能..."
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              System Prompt (技能的"大脑")
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={12}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-violet-500 resize-none font-mono"
              placeholder="输入 system prompt..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-800 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
          >
            <Save size={12} />
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
