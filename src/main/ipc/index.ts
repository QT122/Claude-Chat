import { registerApiKeyHandlers } from './api-key'
import { registerFileSystemHandlers } from './file-system'
import { registerChatHandlers } from './chat'
import { registerConversationHandlers } from './conversations'
import { registerWindowHandlers } from './window'
import { registerMemoryHandlers } from './memory'
import { registerSkillsHandlers } from './skills'
import { registerAvatarHandlers } from './avatar'
import { registerAppSettingsHandlers } from './app-settings'
import { registerMediaHandlers } from './media'
import { cleanupExpiredMedia } from '../services/media-store'

export function registerAllHandlers(): void {
  cleanupExpiredMedia()
  registerApiKeyHandlers()
  registerFileSystemHandlers()
  registerChatHandlers()
  registerConversationHandlers()
  registerMemoryHandlers()
  registerSkillsHandlers()
  registerWindowHandlers()
  registerAvatarHandlers()
  registerAppSettingsHandlers()
  registerMediaHandlers()
}
