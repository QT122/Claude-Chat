import { FileText, Image } from 'lucide-react'
import type { Message } from '../../types/message'

interface Props {
  message: Message
}

export default function UserMessage({ message }: Props) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] bg-violet-600 text-white rounded-2xl rounded-br-md px-4 py-2.5 space-y-2">
        {/* File attachments */}
        {message.files && message.files.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {message.files.map((f) => (
              <div key={f.id} className="flex items-center gap-1 bg-violet-700/50 rounded-lg px-2 py-1">
                {f.isImage ? (
                  <>
                    <Image size={12} className="text-violet-200" />
                    {f.content && (
                      <img
                        src={`data:image/${f.type};base64,${f.content}`}
                        alt={f.name}
                        className="w-8 h-8 rounded object-cover"
                      />
                    )}
                    <span className="text-[10px] text-violet-200 truncate max-w-[80px]">{f.name}</span>
                  </>
                ) : (
                  <>
                    <FileText size={12} className="text-violet-200" />
                    <span className="text-[10px] text-violet-200 truncate max-w-[100px]">{f.name}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
        <p className="text-sm whitespace-pre-wrap">
          {message.content.length > 20000
            ? message.content.slice(0, 20000) + '\n\n... (消息过长，已截断显示)'
            : message.content}
        </p>
      </div>
    </div>
  )
}
