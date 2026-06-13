import type { Message } from '../../types/message'
import UserMessage from './UserMessage'
import AssistantMessage from './AssistantMessage'

interface Props {
  message: Message
}

export default function MessageBubble({ message }: Props) {
  if (message.role === 'user') {
    return <UserMessage message={message} />
  }

  return <AssistantMessage message={message} />
}
