import { useEffect, useState } from 'react'
import { X, Download, Edit3, ToggleLeft, ToggleRight, Zap, Code2, PenLine, BarChart3, BookOpen, Wrench, Globe, Layers } from 'lucide-react'
import { useSkillsStore } from '../../stores/skills-store'
import { useUIStore } from '../../stores/ui-store'
import SkillEditor from './SkillEditor'
import type { Skill } from '../../types/message'

const categoryIcons: Record<string, React.ReactNode> = {
  writing: <PenLine size={14} />,
  analysis: <BarChart3 size={14} />,
  development: <Code2 size={14} />,
  learning: <BookOpen size={14} />,
  other: <Wrench size={14} />,
}

const categoryNames: Record<string, string> = {
  writing: '写作',
  analysis: '分析',
  development: '开发',
  learning: '学习',
  other: '其他',
}

const skillIcons: Record<string, React.ReactNode> = {
  Presentation: <Layers size={16} />,
  BookOpen: <BookOpen size={16} />,
  SpellCheck: <Wrench size={16} />,
  Code2: <Code2 size={16} />,
  Languages: <Globe size={16} />,
  ClipboardList: <Layers size={16} />,
  BarChart3: <BarChart3 size={16} />,
  PenLine: <PenLine size={16} />,
}

export default function SkillsPanel() {
  const open = useUIStore((s) => s.skillsPanelOpen)
  const setOpen = useUIStore((s) => s.setSkillsPanelOpen)
  const { skills, editingSkill, loadSkills, saveSkill, deleteSkill, downloadSkill, toggleActive, setEditingSkill } = useSkillsStore()
  const [showEditor, setShowEditor] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState('')
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    if (open) loadSkills()
  }, [open, loadSkills])

  const handleSave = (skill: Skill) => {
    saveSkill(skill)
    setShowEditor(false)
    setEditingSkill(null)
  }

  const handleDownload = async () => {
    if (!downloadUrl.trim()) return
    setIsDownloading(true)
    try {
      await downloadSkill(downloadUrl.trim())
      setDownloadUrl('')
    } catch { /* ignore */ }
    setIsDownloading(false)
  }

  if (!open) return null

  // Group by category
  const grouped: Record<string, typeof skills> = {}
  for (const s of skills) {
    const cat = s.category || 'other'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(s)
  }

  return (
    <>
      <div className="fixed inset-0 z-40 flex justify-end">
        <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
        <div className="relative w-96 bg-gray-900 border-l border-gray-700 h-full flex flex-col shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-yellow-400" />
              <h3 className="text-sm font-medium text-gray-200">技能管理</h3>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-3 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <input
                value={downloadUrl}
                onChange={(e) => setDownloadUrl(e.target.value)}
                placeholder="输入技能下载 URL..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-200 outline-none focus:border-violet-500"
              />
              <button
                onClick={handleDownload}
                disabled={!downloadUrl.trim() || isDownloading}
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors flex-shrink-0"
              >
                {isDownloading ? (
                  <span className="animate-spin">⟳</span>
                ) : (
                  <Download size={12} />
                )}
                下载
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {skills.length === 0 ? (
              <div className="text-center text-sm text-gray-500 py-12">
                <Zap size={32} className="mx-auto mb-3 text-gray-700" />
                <p>暂无技能</p>
              </div>
            ) : (
              Object.entries(grouped).map(([cat, items]) => (
                <div key={cat}>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1.5 px-1">
                    {categoryIcons[cat] || <Wrench size={12} />}
                    <span>{categoryNames[cat] || cat}</span>
                    <span className="text-gray-700">({items.length})</span>
                  </div>
                  <div className="space-y-1">
                    {items.map((skill) => (
                      <div
                        key={skill.id}
                        className="group bg-gray-800/50 rounded-lg px-3 py-2 border border-gray-700/50 hover:border-gray-600 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-gray-400">
                                {skillIcons[skill.icon] || <Wrench size={14} />}
                              </span>
                              <span className="text-sm text-gray-200 font-medium truncate">{skill.name}</span>
                              {skill.builtIn && (
                                <span className="text-[10px] bg-violet-900/50 text-violet-300 px-1.5 rounded">内置</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{skill.description}</div>
                          </div>
                          <div className="flex items-center gap-0.5 flex-shrink-0">
                            <button
                              onClick={() => toggleActive(skill.id)}
                              className="p-0.5 hover:bg-gray-700 rounded text-gray-500 hover:text-green-400 transition-colors"
                              title={skill.active ? '停用' : '激活'}
                            >
                              {skill.active ? (
                                <ToggleRight size={18} className="text-green-400" />
                              ) : (
                                <ToggleLeft size={18} />
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setEditingSkill(skill)
                                setShowEditor(true)
                              }}
                              className="p-0.5 hover:bg-gray-700 rounded text-gray-500 hover:text-violet-400 transition-colors"
                              title="编辑技能"
                            >
                              <Edit3 size={12} />
                            </button>
                            {!skill.builtIn && (
                              <button
                                onClick={() => deleteSkill(skill.id)}
                                className="p-0.5 hover:bg-red-800/50 rounded text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                title="删除"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showEditor && editingSkill && (
        <SkillEditor
          skill={editingSkill}
          onSave={handleSave}
          onClose={() => {
            setShowEditor(false)
            setEditingSkill(null)
          }}
        />
      )}
    </>
  )
}
