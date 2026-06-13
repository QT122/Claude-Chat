import { useState, useEffect } from 'react'
import Sidebar from './components/layout/Sidebar'
import ChatArea from './components/layout/ChatArea'
import TitleBar from './components/layout/TitleBar'
import SettingsDialog from './components/settings/SettingsDialog'
import ErrorToast from './components/shared/ErrorToast'

import MemoryPanel from './components/memory/MemoryPanel'
import SkillsPanel from './components/skills/SkillsPanel'
import ProjectFileBrowser from './components/layout/ProjectFileBrowser'
import FileViewer from './components/layout/FileViewer'
import ResizableSplit from './components/layout/ResizableSplit'
import { useSettingsStore } from './stores/settings-store'
import { useModeStore } from './stores/mode-store'
import { useUIStore } from './stores/ui-store'

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const loadSettings = useSettingsStore((s) => s.loadSettings)
  const loadAvatar = useUIStore((s) => s.loadAvatar)
  const loadDisplayName = useUIStore((s) => s.loadDisplayName)
  const loadBackground = useUIStore((s) => s.loadBackground)
  const mode = useModeStore((s) => s.mode)

  useEffect(() => {
    loadSettings()
    loadAvatar()
    loadDisplayName()
    loadBackground()
  }, [loadSettings, loadAvatar, loadDisplayName, loadBackground])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === ',') {
        e.preventDefault()
        setSettingsOpen(true)
      }
      if (e.key === 'Escape') {
        setSettingsOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="h-full flex flex-col bg-gray-950">
      <TitleBar onSettingsClick={() => setSettingsOpen(true)} />
      <div className="flex flex-1 overflow-hidden min-h-0">
        {mode === 'project' ? (
          <>
            <ResizableSplit initialSize={220} minSize={150} maxSize={400} direction="horizontal">
              <ProjectFileBrowser />
              <ResizableSplit initialSize={500} minSize={300} maxSize={900} direction="horizontal">
                <ChatArea showFileBrowser={false} />
                <FileViewer />
              </ResizableSplit>
            </ResizableSplit>
          </>
        ) : (
          <ResizableSplit initialSize={240} minSize={160} maxSize={400} direction="horizontal">
            <Sidebar onSettingsClick={() => setSettingsOpen(true)} />
            <ChatArea showFileBrowser={false} />
          </ResizableSplit>
        )}
      </div>
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <MemoryPanel />
      <SkillsPanel />
      <ErrorToast />
    </div>
  )
}
