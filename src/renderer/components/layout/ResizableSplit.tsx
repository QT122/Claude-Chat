import { useRef, useState, useCallback, useEffect } from 'react'

interface Props {
  initialSize: number
  minSize?: number
  maxSize?: number
  direction: 'horizontal' | 'vertical'
  children: [React.ReactNode, React.ReactNode]
  className?: string
  onResize?: (size: number) => void
}

export default function ResizableSplit({ initialSize, minSize = 150, maxSize = 600, direction, children, className = '', onResize }: Props) {
  const [size, setSize] = useState(initialSize)
  const [dragging, setDragging] = useState(false)
  const draggingRef = useRef(false)
  const startPosRef = useRef(0)
  const startSizeRef = useRef(0)
  const minSizeRef = useRef(minSize)
  const maxSizeRef = useRef(maxSize)
  const onResizeRef = useRef(onResize)

  minSizeRef.current = minSize
  maxSizeRef.current = maxSize
  onResizeRef.current = onResize

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    draggingRef.current = true
    setDragging(true)
    startPosRef.current = direction === 'horizontal' ? e.clientX : e.clientY
    startSizeRef.current = size
  }, [size, direction])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingRef.current) return
    const currentPos = direction === 'horizontal' ? e.clientX : e.clientY
    const delta = currentPos - startPosRef.current
    const newSize = Math.max(minSizeRef.current, Math.min(maxSizeRef.current, startSizeRef.current + delta))
    setSize(newSize)
    onResizeRef.current?.(newSize)
  }, [direction])

  const handleMouseUp = useCallback(() => {
    draggingRef.current = false
    setDragging(false)
  }, [])

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  useEffect(() => {
    if (dragging) {
      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize'
      document.body.style.userSelect = 'none'
    } else {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [dragging, direction])

  const isH = direction === 'horizontal'

  return (
    <div className={`flex-1 min-h-0 flex ${isH ? 'flex-row' : 'flex-col'} ${className}`}>
      <div
        style={{ width: isH ? size : '100%', flexShrink: 0 }}
        className="overflow-hidden flex flex-col"
      >
        {children[0]}
      </div>
      <div
        onMouseDown={handleMouseDown}
        className={`flex-shrink-0 group transition-colors ${
          isH ? 'w-[6px] cursor-col-resize' : 'h-[6px] cursor-row-resize'
        } ${dragging ? 'bg-violet-500' : 'bg-gray-800 hover:bg-violet-500'}`}
      >
        <div className={`h-full rounded-full mx-auto transition-opacity ${
          isH ? 'w-[2px]' : 'h-[2px]'
        } ${dragging ? 'bg-violet-300 opacity-100' : 'bg-gray-600 opacity-0 group-hover:opacity-100'}`} />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {children[1]}
      </div>
    </div>
  )
}
