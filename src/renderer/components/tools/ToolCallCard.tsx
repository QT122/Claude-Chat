import { useState } from 'react'
import { ChevronDown, ChevronRight, FileText, FolderOpen, Search, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import type { ToolCall } from '../../types/message'

import { Brain } from 'lucide-react'

const toolIcons: Record<string, React.ReactNode> = {
  read_file: <FileText size={14} />,
  list_directory: <FolderOpen size={14} />,
  search_content: <Search size={14} />,
  save_memory: <Brain size={14} />,
}

const toolLabels: Record<string, string> = {
  read_file: '读取文件',
  list_directory: '列出目录',
  search_content: '搜索内容',
  save_memory: '保存记忆',
  write_file: '写入文件',
  edit_file: '编辑文件',
}

const statusIcon = (status: string) => {
  switch (status) {
    case 'running':
    case 'parsing':
      return <Loader2 size={14} className="animate-spin text-blue-400" />
    case 'done':
      return <CheckCircle2 size={14} className="text-green-400" />
    case 'error':
      return <XCircle size={14} className="text-red-400" />
    default:
      return <Loader2 size={14} className="text-gray-500" />
  }
}

interface Props {
  toolCall: ToolCall
}

export default function ToolCallCard({ toolCall }: Props) {
  const [expanded, setExpanded] = useState(false)
  const icon = toolIcons[toolCall.name] || <FileText size={14} />
  const label = toolLabels[toolCall.name] || toolCall.name

  // Parse input for display
  let inputDisplay = toolCall.input
  try {
    const parsed = JSON.parse(toolCall.input)
    inputDisplay = Object.entries(parsed)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ')
  } catch {
    // Not JSON yet (streaming partial), show as-is
    inputDisplay = toolCall.input || '(等待中...)'
  }

  return (
    <div className="border border-gray-700/50 rounded-lg overflow-hidden bg-gray-900/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:bg-gray-800/50 transition-colors"
      >
        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {statusIcon(toolCall.status)}
        <span className="text-gray-500">{icon}</span>
        <span className="font-medium text-gray-300">{label}</span>
        <span className="text-gray-600 truncate flex-1 text-left">
          {inputDisplay}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-gray-700/50">
          {/* Input */}
          <div className="px-3 py-2">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Input</div>
            <pre className="text-xs text-gray-400 bg-gray-950/50 rounded p-2 overflow-x-auto max-h-32">
              {(() => {
                try {
                  return JSON.stringify(JSON.parse(toolCall.input), null, 2)
                } catch {
                  return toolCall.input || '(无)'
                }
              })()}
            </pre>
          </div>

          {/* Output */}
          {toolCall.output && (
            <div className="px-3 py-2 border-t border-gray-700/30">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Output</div>
              <pre className={`text-xs p-2 rounded overflow-x-auto max-h-48 overflow-y-auto ${
                toolCall.isError ? 'text-red-400 bg-red-950/20' : 'text-gray-400 bg-gray-950/50'
              }`}>
                {toolCall.output}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
