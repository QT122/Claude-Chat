import { useCallback, useState } from 'react'
import { Copy, Check } from 'lucide-react'
import type { Message } from '../../types/message'
import ThinkingProcess from './ThinkingProcess'
import MediaDisplay from './MediaDisplay'
import SafeMarkdown from './SafeMarkdown'
import QuoteOverlay from './QuoteOverlay'

interface Props {
  message: Message
}

function CodeBlock({ children }: { children?: React.ReactNode }) {
  const [copied, setCopied] = useState(false)

  // Extract text and language from the <code> child
  let codeText = ''
  let lang = ''
  if (children) {
    const child = React.Children.toArray(children)[0] as React.ReactElement | undefined
    if (child && child.props) {
      codeText = String(child.props.children || '')
      lang = (child.props.className || '').replace('language-', '')
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(codeText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group my-3 rounded-lg overflow-hidden border border-gray-700">
      <div className="flex items-center justify-between px-4 py-1.5 bg-gray-800/80">
        <span className="text-[10px] text-gray-500 uppercase">{lang || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-200 transition-colors"
        >
          {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
          <span>{copied ? '已复制' : '复制'}</span>
        </button>
      </div>
      <pre className="!bg-[#0d1117] !m-0 !p-4 overflow-x-auto text-[12px] leading-relaxed">
        {children}
      </pre>
    </div>
  )
}

function DownloadableImage(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const handleClick = useCallback(async () => {
    const src = props.src
    if (!src) return
    try {
      const result = await window.api.downloadFile(src)
      if (result.canceled) return
      if (!result.success) {
        console.error('Download failed:', result.error)
      }
    } catch { /* ignore */ }
  }, [props.src])

  return (
    <img
      {...props}
      onClick={handleClick}
      className="max-w-full max-h-96 rounded-lg my-2 cursor-pointer hover:opacity-90 transition-opacity"
      title="点击下载图片"
      alt={props.alt || '图片'}
    />
  )
}

function ClickableLink(props: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const href = props.href
    if (href) {
      window.api.openExternal(href)
    }
  }, [props.href])

  return (
    <a
      {...props}
      onClick={handleClick}
      className="text-violet-400 hover:text-violet-300 underline cursor-pointer"
    />
  )
}

export default function AssistantMessage({ message }: Props) {
  const [quoteOpen, setQuoteOpen] = useState(false)

  return (
    <div className="flex gap-3">
      <div
        className="w-7 h-7 rounded-full bg-violet-900 flex items-center justify-center flex-shrink-0 mt-0.5 cursor-pointer hover:bg-violet-700 hover:scale-110 active:scale-95 transition-all duration-200 select-none"
        onDoubleClick={() => setQuoteOpen(true)}
        title="双击获取今日寄语"
      >
        <span className="text-xs text-violet-300 font-bold">C</span>
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        {/* Media items - generated images/videos */}
        {message.mediaItems && message.mediaItems.length > 0 && (
          <div className="space-y-2">
            {message.mediaItems.map((item) => (
              <MediaDisplay key={item.id} item={item} />
            ))}
          </div>
        )}

        {/* Thinking process - shown before text */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <ThinkingProcess toolCalls={message.toolCalls} />
        )}

        {/* Text content */}
        {message.content && (
          <div className="prose prose-invert prose-sm max-w-none text-gray-200">
            {message.isStreaming ? (
              <span className="streaming-cursor">{message.content}</span>
            ) : (
              <SafeMarkdown
                content={message.content}
                components={{ img: DownloadableImage, a: ClickableLink, pre: CodeBlock }}
              />
            )}
          </div>
        )}

        {/* Show spinner if streaming with no content yet */}
        {message.isStreaming && !message.content && (!message.toolCalls || message.toolCalls.length === 0) && (
          <span className="inline-flex items-center gap-1 text-gray-500 text-sm">
            <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        )}
      </div>

      {quoteOpen && <QuoteOverlay onClose={() => setQuoteOpen(false)} />}
    </div>
  )
}
