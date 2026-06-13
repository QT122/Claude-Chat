import { create } from 'zustand'

export type AppMode = 'chat' | 'project'

interface ModeState {
  mode: AppMode
  setMode: (mode: AppMode) => void
  toggleMode: () => void
}

export const useModeStore = create<ModeState>((set) => ({
  mode: 'chat',

  setMode: (mode) => set({ mode }),
  toggleMode: () => set((s) => ({ mode: s.mode === 'chat' ? 'project' : 'chat' })),
}))
