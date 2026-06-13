import { useState, useEffect } from 'react'
import { useSettingsStore } from '../../stores/settings-store'
import { FolderOpen, FileText } from 'lucide-react'

export default function ProjectTab() {
  const { projectDir, setProjectDir } = useSettingsStore()
  const [fileCount, setFileCount] = useState<number>(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (projectDir) {
      loadFiles()
    }
  }, [projectDir])

  const loadFiles = async () => {
    if (!projectDir) return
    setLoading(true)
    try {
      const result = await window.api.listFiles(projectDir)
      if (result.files) {
        setFileCount(result.files.length)
      }
    } catch {
      setFileCount(0)
    }
    setLoading(false)
  }

  const handlePickDir = async () => {
    const result = await window.api.pickProjectDir()
    if (!result.canceled && result.path) {
      setProjectDir(result.path)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-gray-300">
        <FolderOpen size={16} />
        <span className="font-medium">项目目录</span>
      </div>

      <div className="space-y-2">
        {projectDir ? (
          <>
            <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2 border border-gray-700">
              <FileText size={14} className="text-gray-500 flex-shrink-0" />
              <span className="text-sm text-gray-300 truncate flex-1">{projectDir}</span>
            </div>
            {loading ? (
              <p className="text-xs text-gray-500">加载中...</p>
            ) : (
              <p className="text-xs text-gray-500">
                {fileCount > 0 ? `检测到 ${fileCount} 个文件/目录` : '目录为空'}
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={handlePickDir}
                className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors"
              >
                更换目录
              </button>
              <button
                onClick={() => setProjectDir(null)}
                className="px-3 py-1.5 text-xs bg-red-900/50 hover:bg-red-800 text-red-300 rounded-lg transition-colors"
              >
                清除
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={handlePickDir}
            className="w-full px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 rounded-lg border border-gray-700 border-dashed transition-colors"
          >
            📁 选择项目目录...
          </button>
        )}
      </div>

      <p className="text-xs text-gray-600">
        选择项目目录后，Claude 可以读取、搜索项目中的文件。所有文件操作都限制在此目录内。
      </p>
    </div>
  )
}
