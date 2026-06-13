import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useUIStore } from '../../stores/ui-store'

export default function ErrorToast() {
  const errorToast = useUIStore((s) => s.errorToast)
  const clearError = useUIStore((s) => s.clearError)

  useEffect(() => {
    if (errorToast) {
      const timer = setTimeout(clearError, 8000)
      return () => clearTimeout(timer)
    }
  }, [errorToast, clearError])

  if (!errorToast) return null

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-in">
      <div className="flex items-center gap-3 bg-red-900/90 text-red-200 px-4 py-3 rounded-lg shadow-lg border border-red-700/50 max-w-md">
        <p className="text-sm flex-1">{errorToast}</p>
        <button
          onClick={clearError}
          className="text-red-400 hover:text-red-200 flex-shrink-0"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
