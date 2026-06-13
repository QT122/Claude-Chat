import { create } from 'zustand'

interface UIState {
  sidebarOpen: boolean
  settingsOpen: boolean
  errorToast: string | null
  theme: 'dark' | 'light'
  backgroundImage: string | null
  avatarImage: string | null
  avatarPreview: string | null
  avatarPreviously: string | null
  displayName: string
  memoryPanelOpen: boolean
  skillsPanelOpen: boolean

  toggleSidebar: () => void
  setSettingsOpen: (open: boolean) => void
  showError: (msg: string) => void
  clearError: () => void
  setTheme: (theme: 'dark' | 'light') => void
  setBackgroundImage: (dataUrl: string | null, persist?: boolean) => void
  loadBackground: () => Promise<void>
  setAvatarImage: (dataUrl: string | null) => void
  pickAvatarPreview: () => Promise<void>
  confirmAvatar: () => void
  cancelAvatar: () => void
  loadAvatar: () => Promise<void>
  setDisplayName: (name: string) => Promise<void>
  loadDisplayName: () => Promise<void>
  setMemoryPanelOpen: (open: boolean) => void
  setSkillsPanelOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  settingsOpen: false,
  errorToast: null,
  theme: 'dark',
  backgroundImage: null,
  avatarImage: null,
  avatarPreview: null,
  avatarPreviously: null,
  displayName: 'Claude Chat',
  memoryPanelOpen: false,
  skillsPanelOpen: false,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  showError: (msg) => set({ errorToast: msg }),
  clearError: () => set({ errorToast: null }),
  setTheme: (theme) => set({ theme }),
  setBackgroundImage: (dataUrl, persist) => {
    set({ backgroundImage: dataUrl })
    if (persist && dataUrl) {
      window.api.saveBackground(dataUrl)
    }
  },
  loadBackground: async () => {
    try {
      const result = await window.api.loadBackground()
      if (result.dataUrl) set({ backgroundImage: result.dataUrl })
    } catch { /* ignore */ }
  },
  setAvatarImage: (dataUrl) => set({ avatarImage: dataUrl }),
  loadAvatar: async () => {
    try {
      const result = await window.api.loadAvatar()
      if (result.dataUrl) set({ avatarImage: result.dataUrl })
    } catch { /* ignore */ }
  },
  pickAvatarPreview: async () => {
    try {
      const result = await window.api.pickAvatar()
      if (!result.canceled && result.dataUrl) {
        set((s) => ({
          avatarPreviously: s.avatarImage,
          avatarPreview: result.dataUrl,
          avatarImage: result.dataUrl,
        }))
      }
    } catch { /* ignore */ }
  },
  confirmAvatar: () => set({ avatarPreview: null, avatarPreviously: null }),
  cancelAvatar: () =>
    set((s) => ({
      avatarImage: s.avatarPreviously,
      avatarPreview: null,
      avatarPreviously: null,
    })),
  setDisplayName: async (name: string) => {
    set({ displayName: name })
    await window.api.setSetting('displayName', name)
  },
  loadDisplayName: async () => {
    try {
      const result = await window.api.getSetting('displayName')
      if (result.value && typeof result.value === 'string') {
        set({ displayName: result.value })
      }
    } catch { /* ignore */ }
  },
  setMemoryPanelOpen: (open) => set({ memoryPanelOpen: open }),
  setSkillsPanelOpen: (open) => set({ skillsPanelOpen: open }),
}))
