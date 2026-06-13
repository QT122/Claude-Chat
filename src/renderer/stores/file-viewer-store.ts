import { create } from 'zustand'

interface OpenedFile {
  name: string
  path: string
  content: string
  language?: string
}

interface FileViewerState {
  openedFile: OpenedFile | null
  openFile: (file: OpenedFile) => void
  closeFile: () => void
}

export const useFileViewerStore = create<FileViewerState>((set) => ({
  openedFile: null,
  openFile: (file) => set({ openedFile: file }),
  closeFile: () => set({ openedFile: null }),
}))
