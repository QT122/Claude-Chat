import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { ChevronDown, ChevronRight, Loader2, CheckCircle2, XCircle, Wrench } from 'lucide-react'
import type { ToolCall } from '../../types/message'

interface Props {
  toolCalls: ToolCall[]
}

export default function ThinkingProcess({ toolCalls }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  if (toolCalls.length === 0) return null

  const allDone = toolCalls.every((tc) => tc.status === 'done' || tc.status === 'error')
  const hasRunning = toolCalls.some((tc) => tc.status === 'running' || tc.status === 'parsing')

  return (
    <div className="border-l-2 border-violet-700/50 ml-2 pl-3 my-2">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-200 transition-colors mb-1.5"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
        <Wrench size={12} className="text-violet-400" />
        <span>
          {hasRunning ? '思考中...' : `工具调用完成 (${toolCalls.length})`}
        </span>
        {hasRunning && <Loader2 size={12} className="animate-spin text-violet-400" />}
      </button>

      {!collapsed && (
        <div className="space-y-1">
          {toolCalls.map((tc) => (
            <ThinkingStep key={tc.id} toolCall={tc} />
          ))}
        </div>
      )}
    </div>
  )
}

function ThinkingStep({ toolCall }: { toolCall: ToolCall }) {
  const [expanded, setExpanded] = useState(false)

  const statusIcon = () => {
    switch (toolCall.status) {
      case 'running':
      case 'parsing':
        return <Loader2 size={11} className="animate-spin text-blue-400" />
      case 'done':
        return <CheckCircle2 size={11} className="text-green-400" />
      case 'error':
        return <XCircle size={11} className="text-red-400" />
      default:
        return <div className="w-2.5 h-2.5 rounded-full border border-gray-600" />
    }
  }

  const mediaTools = ['generate_image', 'generate_video']
  const isMediaTool = mediaTools.includes(toolCall.name)

  const toolLabels: Record<string, string> = {
    read_file: '读取文件',
    list_directory: '列出目录',
    search_content: '搜索内容',
    save_memory: '保存记忆',
    write_file: '写入文件',
    edit_file: '编辑文件',
    generate_image: 'AI 生图',
    generate_video: 'AI 生视频',
  }
  const label = toolLabels[toolCall.name] || toolCall.name

  let inputDisplay = ''
  try {
    const parsed = JSON.parse(toolCall.input)
    inputDisplay = Object.values(parsed).join(', ')
  } catch {
    inputDisplay = toolCall.input || ''
  }

  return (
    <div className="text-xs">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left text-gray-500 hover:text-gray-300 transition-colors py-0.5"
      >
        {statusIcon()}
        <span className="text-gray-400 font-medium">{label}</span>
        <span className="text-gray-600 truncate">{inputDisplay}</span>
      </button>

      {expanded && (
        <div className="ml-5 mt-0.5 mb-1 space-y-1">
          <div className="bg-gray-900/60 rounded p-2">
            <div className="text-[10px] text-gray-500 uppercase mb-0.5">输入</div>
            <pre className="text-gray-400 whitespace-pre-wrap break-all">
              {(() => {
                try {
                  return JSON.stringify(JSON.parse(toolCall.input), null, 2)
                } catch {
                  return toolCall.input || '(无)'
                }
              })()}
            </pre>
          </div>
          {toolCall.output && (
            <div className="bg-gray-900/60 rounded p-2">
              <div className="text-[10px] text-gray-500 uppercase mb-0.5">输出</div>
              {isMediaTool && !toolCall.isError ? (
                <div className="prose prose-invert prose-sm max-w-none text-gray-400">
                  <ReactMarkdown>{toolCall.output}</ReactMarkdown>
                </div>
              ) : (
                <pre className={`whitespace-pre-wrap break-all overflow-x-auto max-h-32 overflow-y-auto ${
                  toolCall.isError ? 'text-red-400' : 'text-gray-400'
                }`}>
                  {toolCall.output}
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
