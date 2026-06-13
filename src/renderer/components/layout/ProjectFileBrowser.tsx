import { useState, useEffect } from 'react'
import { Folder, FileText, FolderOpen, RefreshCw, ChevronRight, ChevronDown, ChevronLeft, MessageSquare, Plus, Trash2, Edit3, Check, X } from 'lucide-react'
import { useSettingsStore } from '../../stores/settings-store'
import { useConversationStore } from '../../stores/conversation-store'
import { useFileViewerStore } from '../../stores/file-viewer-store'

interface DirEntry {
  name: string
  path: string
  isDirectory: boolean
  size: number
}

interface ConvSummary {
  id: string
  title: string
  createdAt: number
  updatedAt: number
}

type Tab = 'files' | 'chats'

export default function ProjectFileBrowser() {
  const projectDir = useSettingsStore((s) => s.projectDir)
  const [activeTab, setActiveTab] = useState<Tab>('files')
  const [files, setFiles] = useState<DirEntry[]>([])
  const [currentPath, setCurrentPath] = useState(projectDir || '')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [convos, setConvos] = useState<ConvSummary[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const activeId = useState<string | null>(null)[0]

  // Navigation history
  const [navHistory, setNavHistory] = useState<string[]>([])
  const [navIndex, setNavIndex] = useState(-1)

  const navigateTo = async (dirPath: string, addToHistory: boolean) => {
    try {
      setError(null)
      setCurrentPath(dirPath)
      const result = await window.api.listFiles(dirPath)
      if (result.error) {
        setError(result.error)
        setFiles([])
      } else {
        setFiles(result.files)
        if (addToHistory) {
          const newHistory = navHistory.slice(0, navIndex + 1)
          newHistory.push(dirPath)
          setNavHistory(newHistory)
          setNavIndex(newHistory.length - 1)
        }
      }
    } catch (err) {
      setError(String(err))
      setFiles([])
    }
  }

  const goBack = () => {
    if (navIndex > 0) {
      const newIndex = navIndex - 1
      setNavIndex(newIndex)
      navigateTo(navHistory[newIndex], false)
    }
  }

  const goForward = () => {
    if (navIndex < navHistory.length - 1) {
      const newIndex = navIndex + 1
      setNavIndex(newIndex)
      navigateTo(navHistory[newIndex], false)
    }
  }

  useEffect(() => {
    if (projectDir) {
      navigateTo(projectDir, true)
    }
  }, [projectDir])

  // Check if project dir still exists
  const dirMissing = projectDir && error && error.includes('ENOENT')

  useEffect(() => {
    if (activeTab === 'chats') loadChats()
  }, [activeTab])

  const loadDir = async (dirPath: string) => {
    navigateTo(dirPath, true)
  }

  const loadChats = async () => {
    try {
      const result = await window.api.listConversations('project')
      setConvos(result.conversations || [])
    } catch { /* ignore */ }
  }

  const toggleDir = async (dirPath: string) => {
    const newExpanded = new Set(expanded)
    if (newExpanded.has(dirPath)) {
      newExpanded.delete(dirPath)
    } else {
      newExpanded.add(dirPath)
    }
    navigateTo(dirPath, true)
  }

  const handleFileClick = async (entry: DirEntry) => {
    if (entry.isDirectory) {
      toggleDir(entry.path)
    } else {
      try {
        const result = await window.api.readFile(entry.path, projectDir || undefined)
        if (result.content !== null) {
          // Open file in the right panel
          useFileViewerStore.getState().openFile({
            name: entry.name,
            path: entry.path,
            content: result.content,
          })
        }
      } catch { /* ignore */ }
    }
  }

  const handlePickDir = async () => {
    const result = await window.api.pickProjectDir()
    if (result.path) {
      useSettingsStore.getState().setProjectDir(result.path)
      setCurrentPath(result.path)
      loadDir(result.path)
    }
  }

  const handleLoadChat = async (id: string) => {
    try {
      const result = await window.api.loadConversation(id)
      if (result.conversation) {
        const conv = result.conversation as any
        useConversationStore.getState().clearMessages()
        for (const msg of conv.messages) {
          useConversationStore.getState().addMessage(msg)
        }
        if (conv.title) {
          useConversationStore.getState().setTitle(conv.title)
        }
      }
    } catch { /* ignore */ }
  }

  const handleNewChat = () => {
    useConversationStore.getState().clearMessages()
    useConversationStore.getState().setTitle('')
  }

  const confirmDeleteChat = async (id: string) => {
    await window.api.deleteConversation(id)
    setDeletingId(null)
    loadChats()
  }

  const saveChatTitle = async (id: string) => {
    if (editTitle.trim()) {
      const full = await window.api.loadConversation(id)
      if (full.conversation) {
        await window.api.saveConversation({ ...(full.conversation as any), title: editTitle.trim() })
      }
    }
    setEditingId(null)
    setEditTitle('')
    loadChats()
  }

  const sortedFiles = [...files].sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  const formatDate = (ts: number) => {
    const d = new Date(ts)
    const now = new Date()
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Tab bar */}
      <div className="flex border-b border-gray-800">
        <button
          onClick={() => setActiveTab('files')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors border-b -mb-px ${
            activeTab === 'files'
              ? 'text-violet-400 border-violet-400'
              : 'text-gray-500 border-transparent hover:text-gray-300'
          }`}
        >
          <FolderOpen size={13} />
          文件
        </button>
        <button
          onClick={() => setActiveTab('chats')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors border-b -mb-px ${
            activeTab === 'chats'
              ? 'text-violet-400 border-violet-400'
              : 'text-gray-500 border-transparent hover:text-gray-300'
          }`}
        >
          <MessageSquare size={13} />
          对话
        </button>
      </div>

      {activeTab === 'files' ? (
        <>
          {/* File explorer header */}
          <div className="flex items-center justify-between px-2 py-1.5 border-b border-gray-800/50">
            <div className="flex items-center gap-1 min-w-0 flex-1 text-xs text-gray-400 truncate" title={currentPath}>
              {currentPath ? (currentPath.split(/[/\\]/).pop() || '根目录') : '未选择项目'}
            </div>
            <div className="flex items-center gap-0.5">
              <button onClick={goBack} disabled={navIndex <= 0}
                className="p-1 hover:bg-gray-700 rounded text-gray-500 hover:text-white disabled:opacity-30" title="后退">
                <ChevronLeft size={11} />
              </button>
              <button onClick={goForward} disabled={navIndex >= navHistory.length - 1}
                className="p-1 hover:bg-gray-700 rounded text-gray-500 hover:text-white disabled:opacity-30" title="前进">
                <ChevronRight size={11} />
              </button>
              <button onClick={() => loadDir(currentPath)} className="p-1 hover:bg-gray-700 rounded text-gray-500 hover:text-white" title="刷新">
                <RefreshCw size={11} />
              </button>
              <button onClick={handlePickDir} className="p-1 hover:bg-gray-700 rounded text-gray-500 hover:text-white" title="打开文件夹">
                <Folder size={11} />
              </button>
            </div>
          </div>

          {/* File tree */}
          <div className="flex-1 overflow-y-auto py-0.5">
            {!projectDir ? (
              <div className="p-4 text-center">
                <FolderOpen size={28} className="mx-auto mb-2 text-gray-600" />
                <p className="text-xs text-gray-500 mb-2">未打开项目</p>
                <button onClick={handlePickDir} className="px-3 py-1 text-xs bg-violet-600 hover:bg-violet-500 text-white rounded">
                  打开文件夹
                </button>
              </div>
            ) : dirMissing ? (
              <div className="p-4 text-center">
                <FolderOpen size={28} className="mx-auto mb-2 text-gray-600" />
                <p className="text-xs text-gray-500 mb-1">项目目录不存在</p>
                <p className="text-[10px] text-gray-600 mb-2 truncate px-2">{projectDir}</p>
                <button onClick={handlePickDir} className="px-3 py-1 text-xs bg-violet-600 hover:bg-violet-500 text-white rounded">
                  重新选择
                </button>
              </div>
            ) : error ? (
              <div className="px-3 py-2 text-xs text-red-400">{error}</div>
            ) : sortedFiles.length === 0 ? (
              <div className="text-xs text-gray-600 text-center py-4">目录为空</div>
            ) : (
              sortedFiles.map((entry) => (
                <button
                  key={entry.path}
                  onClick={() => handleFileClick(entry)}
                  className="w-full flex items-center gap-1 px-2 py-0.5 text-xs text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors text-left"
                >
                  {entry.isDirectory ? (
                    <>
                      {expanded.has(entry.path) ? (
                        <ChevronDown size={10} className="text-gray-600 flex-shrink-0" />
                      ) : (
                        <ChevronRight size={10} className="text-gray-600 flex-shrink-0" />
                      )}
                      <Folder size={12} className="text-yellow-600 flex-shrink-0" />
                    </>
                  ) : (
                    <>
                      <span className="w-[10px] flex-shrink-0" />
                      <FileText size={12} className="text-blue-400 flex-shrink-0" />
                    </>
                  )}
                  <span className="truncate ml-0.5">{entry.name}</span>
                </button>
              ))
            )}
          </div>
        </>
      ) : (
        <>
          {/* Chat list */}
          <div className="p-2 border-b border-gray-800/50">
            <button onClick={handleNewChat} className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs text-gray-300 hover:bg-gray-800 rounded transition-colors">
              <Plus size={13} />
              新对话
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-0.5">
            {convos.length === 0 ? (
              <div className="text-xs text-gray-600 text-center py-4">暂无对话</div>
            ) : (
              convos.map((conv) => (
                <div key={conv.id} className="group flex items-center gap-1 px-2 py-1 hover:bg-gray-800 text-xs text-gray-400 hover:text-gray-200 transition-colors">
                  {deletingId === conv.id ? (
                    <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                      <span className="text-[10px] text-red-400">删除?</span>
                      <button onClick={() => confirmDeleteChat(conv.id)} className="px-1 text-[10px] bg-red-600 text-white rounded">是</button>
                      <button onClick={() => setDeletingId(null)} className="px-1 text-[10px] bg-gray-600 text-gray-300 rounded">否</button>
                    </div>
                  ) : editingId === conv.id ? (
                    <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveChatTitle(conv.id); if (e.key === 'Escape') { setEditingId(null); setEditTitle(''); } }}
                        className="flex-1 bg-gray-700 border border-violet-500 rounded px-1 py-0 text-xs text-gray-200 outline-none"
                        autoFocus
                      />
                      <button onClick={() => saveChatTitle(conv.id)} className="text-green-400"><Check size={10} /></button>
                      <button onClick={() => { setEditingId(null); setEditTitle(''); }} className="text-red-400"><X size={10} /></button>
                    </div>
                  ) : (
                    <>
                      <MessageSquare size={11} className="flex-shrink-0 text-gray-600" />
                      <span
                        className="truncate flex-1 cursor-pointer"
                        onClick={() => handleLoadChat(conv.id)}
                      >{conv.title}</span>
                      <span className="text-[9px] text-gray-700">{formatDate(conv.updatedAt)}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingId(conv.id); setEditTitle(conv.title); }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-700 rounded text-gray-600 hover:text-violet-400"
                      >
                        <Edit3 size={9} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeletingId(conv.id); }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-800/50 rounded text-gray-600 hover:text-red-400"
                      >
                        <Trash2 size={9} />
                      </button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
