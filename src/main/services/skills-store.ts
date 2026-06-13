import { readFileSync, writeFileSync, readdirSync, unlinkSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'
import { builtInSkills, type SkillDefinition } from './skills-registry'

export interface SkillRecord {
  id: string
  name: string
  description: string
  icon: string
  systemPrompt: string
  category: 'writing' | 'analysis' | 'development' | 'learning' | 'other'
  active: boolean
  builtIn: boolean
  downloadUrl?: string
  createdAt: number
  updatedAt: number
}

function getStoreDir(): string {
  const dir = join(app.getPath('userData'), 'skills')
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  return dir
}

function getSkillPath(id: string): string {
  return join(getStoreDir(), `${id}.json`)
}

export function ensureBuiltInSkills(): void {
  for (const skill of builtInSkills) {
    const path = getSkillPath(skill.id)
    if (!existsSync(path)) {
      const record: SkillRecord = {
        ...skill,
        active: false,
        builtIn: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      writeFileSync(path, JSON.stringify(record, null, 2), 'utf-8')
    }
  }
}

export function saveSkill(skill: SkillRecord): void {
  const data = JSON.stringify(skill, null, 2)
  writeFileSync(getSkillPath(skill.id), data, 'utf-8')
}

export function loadSkill(id: string): SkillRecord | null {
  try {
    const data = readFileSync(getSkillPath(id), 'utf-8')
    return JSON.parse(data)
  } catch {
    return null
  }
}

export function listSkills(): SkillRecord[] {
  try {
    ensureBuiltInSkills()
    const dir = getStoreDir()
    const files = readdirSync(dir).filter((f) => f.endsWith('.json'))
    const skills: SkillRecord[] = []

    for (const file of files) {
      try {
        const data = readFileSync(join(dir, file), 'utf-8')
        const skill = JSON.parse(data) as SkillRecord
        skills.push(skill)
      } catch {
        // Skip corrupted files
      }
    }

    return skills.sort((a, b) => {
      if (a.builtIn !== b.builtIn) return a.builtIn ? -1 : 1
      return b.updatedAt - a.updatedAt
    })
  } catch {
    return []
  }
}

export function deleteSkill(id: string): boolean {
  try {
    const skill = loadSkill(id)
    if (skill?.builtIn) return false
    const path = getSkillPath(id)
    if (existsSync(path)) {
      unlinkSync(path)
    }
    return true
  } catch {
    return false
  }
}

export async function downloadSkillFromUrl(url: string): Promise<SkillRecord | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const def: SkillDefinition = await response.json()
    const record: SkillRecord = {
      ...def,
      active: false,
      builtIn: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    saveSkill(record)
    return record
  } catch {
    return null
  }
}
