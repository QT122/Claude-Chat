import { X, FileText, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { useFileViewerStore } from '../../stores/file-viewer-store'

export default function FileViewer() {
  const openedFile = useFileViewerStore((s) => s.openedFile)
  const closeFile = useFileViewerStore((s) => s.closeFile)
  const [copied, setCopied] = useState(false)

  if (!openedFile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center" style={{ minWidth: 200, background: '#1a1025', borderLeft: '3px solid #7c3aed' }}>
        <FileText size={40} className="mb-3 opacity-30" style={{ color: '#9ca3af' }} />
        <p style={{ color: '#9ca3af', fontSize: 12 }}>点击左侧文件查看内容</p>
        <p style={{ color: '#6b7280', fontSize: 10, marginTop: 4 }}>文件浏览器已就绪</p>
      </div>
    )
  }

  const content = openedFile.content || ''
  const isImage = content.startsWith('data:image/')

  if (isImage) {
    return (
      <div className="flex-1 flex flex-col" style={{ minWidth: 200, background: '#0d1117', borderLeft: '3px solid #7c3aed' }}>
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800/50" style={{ background: '#161b22' }}>
          <span style={{ color: '#e5e7eb', fontSize: 12 }}>{openedFile.name}</span>
          <button onClick={closeFile} className="p-1.5 hover:bg-gray-700/50 rounded-md" style={{ color: '#9ca3af' }}>✕</button>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <img src={content} alt={openedFile.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
        </div>
      </div>
    )
  }

  const lines = content.split('\n')
  const lineNumbers = lines.map((_, i) => String(i + 1)).join('\n')
  return (
    <div className="flex-1 flex flex-col" style={{ minWidth: 200, background: '#0d1117', borderLeft: '3px solid #7c3aed', minHeight: 0 }}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800/50" style={{ background: '#161b22', flexShrink: 0 }}>
        <span style={{ color: '#e5e7eb', fontSize: 12, fontWeight: 500 }}>{openedFile.name} ({lines.length} 行)</span>
        <button onClick={closeFile} style={{ color: '#9ca3af', padding: 4 }}>✕</button>
      </div>
      <div style={{
        flex: 1, minHeight: 0, overflow: 'scroll',
        display: 'flex', fontFamily: 'monospace', fontSize: 12, lineHeight: '22px',
      }}>
        <pre style={{
          flexShrink: 0, textAlign: 'right', margin: 0, padding: '12px 0 12px 12px',
          color: 'rgba(156,163,175,0.4)', borderRight: '1px solid rgba(75,85,99,0.3)',
          userSelect: 'none',
        }}>{lineNumbers}</pre>
        <pre style={{
          flex: 1, margin: 0, padding: '12px 16px', minWidth: 0,
          color: '#d1d5db', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>{content}</pre>
      </div>
    </div>
  )
}
