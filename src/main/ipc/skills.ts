import { ipcMain } from 'electron'
import { saveSkill, loadSkill, listSkills, deleteSkill, downloadSkillFromUrl } from '../services/skills-store'
import { builtInSkills } from '../services/skills-registry'

export function registerSkillsHandlers(): void {
  ipcMain.handle('skills:builtin', () => {
    return {
      skills: builtInSkills.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        icon: s.icon,
        systemPrompt: s.systemPrompt,
        category: s.category,
        downloadUrl: s.downloadUrl,
      })),
    }
  })

  ipcMain.handle('skills:save', (_event, skill: { id: string; name: string; description: string; icon: string; systemPrompt: string; category: string; active: boolean; builtIn: boolean; createdAt: number; updatedAt: number }) => {
    try {
      saveSkill(skill as any)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('skills:get', (_event, id: string) => {
    try {
      const skill = loadSkill(id)
      return { skill }
    } catch (err) {
      return { skill: null, error: String(err) }
    }
  })

  ipcMain.handle('skills:list', () => {
    try {
      const skills = listSkills()
      return { skills }
    } catch (err) {
      return { skills: [], error: String(err) }
    }
  })

  ipcMain.handle('skills:delete', (_event, id: string) => {
    try {
      const success = deleteSkill(id)
      return { success }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('skills:download', async (_event, url: string) => {
    try {
      const skill = await downloadSkillFromUrl(url)
      if (skill) {
        return { skill }
      }
      return { skill: null, error: '下载失败: 无法获取技能数据' }
    } catch (err) {
      return { skill: null, error: String(err) }
    }
  })
}
