import { useState, useRef, useEffect } from 'react'
import { Pencil } from 'lucide-react'

interface Props {
  title: string
  onSave: (title: string) => void
  placeholder?: string
}

export default function EditableTitle({ title, onSave, placeholder }: Props) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setValue(title)
  }, [title])

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const handleSave = () => {
    const trimmed = value.trim()
    if (trimmed && trimmed !== title) {
      onSave(trimmed)
    }
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave()
          if (e.key === 'Escape') {
            setValue(title)
            setEditing(false)
          }
        }}
        className="bg-gray-800 border border-violet-500 rounded px-2 py-0.5 text-sm text-gray-200 outline-none"
        style={{ width: `${Math.max(value.length * 10 + 40, 100)}px` }}
      />
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors group"
    >
      <span>{title || placeholder || '新对话'}</span>
      <Pencil size={12} className="opacity-0 group-hover:opacity-100 text-gray-500" />
    </button>
  )
}
