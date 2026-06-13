import { useRef, useEffect, useState, useMemo } from 'react'
import { useConversationStore } from '../../stores/conversation-store'
import { useUIStore } from '../../stores/ui-store'
import MessageBubble from './MessageBubble'
import { User, Check, X } from 'lucide-react'

const QUOTES = [
  '种一棵树最好的时间是十年前，其次是现在。',
  '日拱一卒，功不唐捐。',
  '路虽远，行则将至；事虽难，做则必成。',
  '乾坤未定，你我皆是黑马。',
  '星光不问赶路人，时光不负有心人。',
  '你所热爱的，就是你的生活。',
  '凡是过往，皆为序章。',
  '心有猛虎，细嗅蔷薇。',
  '但行好事，莫问前程。',
  '生活明朗，万物可爱。',
  '越过山丘，有人等候。',
  '对未来最大的慷慨，是把一切献给现在。',
  '要有最朴素的生活，与最遥远的梦想。',
  '乘风破浪会有时，直挂云帆济沧海。',
  '海压竹枝低复举，风吹山角晦还明。',
  '莫愁前路无知己，天下谁人不识君。',
  '纵有疾风起，人生不言弃。',
  '山重水复疑无路，柳暗花明又一村。',
  '长风破浪会有时，直挂云帆济沧海。',
  '保持热爱，奔赴山海。',
  '慢慢来，比较快。',
  '相信自己，你比想象中更强大。',
  '每一个不曾起舞的日子，都是对生命的辜负。',
  '既然选择了远方，便只顾风雨兼程。',
]

export default function MessageList() {
  const messages = useConversationStore((s) => s.messages)
  const avatarImage = useUIStore((s) => s.avatarImage)
  const pickAndSetAvatar = useUIStore((s) => s.pickAndSetAvatar)
  const displayName = useUIStore((s) => s.displayName)
  const setDisplayName = useUIStore((s) => s.setDisplayName)
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const quote = useMemo(() => QUOTES[Math.floor(Math.random() * QUOTES.length)], [messages.length])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const startEdit = () => {
    setEditValue(displayName)
    setEditing(true)
  }

  const saveEdit = () => {
    if (editValue.trim()) {
      setDisplayName(editValue.trim())
    }
    setEditing(false)
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
        <button
          onClick={pickAndSetAvatar}
          className="w-20 h-20 rounded-full mb-4 overflow-hidden border-2 border-gray-700 hover:border-violet-500 transition-colors flex items-center justify-center bg-gray-800 group cursor-pointer"
          title="点击更换头像"
        >
          {avatarImage ? (
            <img src={avatarImage} alt="头像" className="w-full h-full object-cover" />
          ) : (
            <User size={36} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
          )}
        </button>

        {editing ? (
          <div className="flex items-center gap-1.5 mb-2">
            <input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditing(false) }}
              className="bg-gray-800 border border-violet-500 rounded px-2 py-0.5 text-sm text-gray-200 outline-none text-center"
              autoFocus
            />
            <button onClick={saveEdit} className="text-green-400 hover:text-green-300"><Check size={14} /></button>
            <button onClick={() => setEditing(false)} className="text-red-400 hover:text-red-300"><X size={14} /></button>
          </div>
        ) : (
          <h2
            className="text-lg font-medium mb-2 cursor-pointer hover:text-gray-300 transition-colors"
            onClick={startEdit}
            title="点击修改名称"
          >
            {displayName}
          </h2>
        )}

        <p className="text-sm text-gray-600 italic">「{quote}」</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="min-h-0 overflow-y-scroll px-4 py-4">
      <div className="max-w-3xl mx-auto space-y-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
