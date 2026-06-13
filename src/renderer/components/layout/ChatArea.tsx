import MessageList from '../chat/MessageList'
import ChatInput from '../chat/ChatInput'
import EditableTitle from '../chat/EditableTitle'
import { useConversationStore } from '../../stores/conversation-store'
import { useUIStore } from '../../stores/ui-store'

interface Props {
  showFileBrowser?: boolean
}

export default function ChatArea({ showFileBrowser = false }: Props) {
  const currentTitle = useConversationStore((s) => s.currentTitle)
  const setTitle = useConversationStore((s) => s.setTitle)
  const backgroundImage = useUIStore((s) => s.backgroundImage)

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-gray-950 relative overflow-hidden">
      {backgroundImage && (
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.15,
          }}
        />
      )}

      <div className="relative z-10 flex-1 min-h-0 flex flex-col min-w-0">
        {currentTitle && (
          <div className="px-4 pt-3 border-b border-gray-800/50 flex-shrink-0">
            <div className="max-w-3xl mx-auto">
              <EditableTitle
                title={currentTitle}
                onSave={setTitle}
                placeholder="新对话"
              />
            </div>
          </div>
        )}

        <MessageList />
        <ChatInput />
      </div>
    </div>
  )
}
