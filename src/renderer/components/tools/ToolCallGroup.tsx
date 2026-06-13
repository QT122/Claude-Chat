import type { ToolCall } from '../../types/message'
import ToolCallCard from './ToolCallCard'

interface Props {
  toolCalls: ToolCall[]
}

export default function ToolCallGroup({ toolCalls }: Props) {
  return (
    <div className="space-y-1.5">
      {toolCalls.map((tc) => (
        <ToolCallCard key={tc.id} toolCall={tc} />
      ))}
    </div>
  )
}
