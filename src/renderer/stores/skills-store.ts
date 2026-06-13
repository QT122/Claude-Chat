import { create } from 'zustand'
import type { Skill } from '../types/message'

interface SkillsState {
  skills: Skill[]
  editingSkill: Skill | null
  activeSkillIds: string[]
  loadSkills: () => Promise<void>
  saveSkill: (skill: Skill) => Promise<void>
  deleteSkill: (id: string) => Promise<void>
  downloadSkill: (url: string) => Promise<void>
  toggleActive: (id: string) => void
  setEditingSkill: (skill: Skill | null) => void
  getActiveSkillPrompts: () => string[]
}

export const useSkillsStore = create<SkillsState>((set, get) => ({
  skills: [],
  editingSkill: null,
  activeSkillIds: [],

  loadSkills: async () => {
    try {
      const result = await window.api.listSkills()
      const skills = result.skills as Skill[]
      set({
        skills,
        activeSkillIds: skills.filter((s) => s.active).map((s) => s.id),
      })
    } catch { /* ignore */ }
  },

  saveSkill: async (skill) => {
    await window.api.saveSkill({
      ...skill,
      updatedAt: Date.now(),
    })
    await get().loadSkills()
  },

  deleteSkill: async (id) => {
    await window.api.deleteSkill(id)
    await get().loadSkills()
  },

  downloadSkill: async (url) => {
    await window.api.downloadSkill(url)
    await get().loadSkills()
  },

  toggleActive: (id) => {
    const skill = get().skills.find((s) => s.id === id)
    if (!skill) return
    const active = !skill.active
    get().saveSkill({ ...skill, active })
  },

  setEditingSkill: (skill) => set({ editingSkill: skill }),

  getActiveSkillPrompts: () => {
    return get().skills
      .filter((s) => s.active)
      .map((s) => s.systemPrompt)
  },
}))
