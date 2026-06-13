import React, { Component } from 'react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error: string | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center h-full bg-gray-950 text-gray-400 text-sm p-8">
          <div className="text-center max-w-md">
            <p className="mb-2 text-red-400">渲染错误</p>
            <pre className="text-xs text-gray-500 mb-4 whitespace-pre-wrap break-all max-h-40 overflow-auto">{this.state.error}</pre>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 rounded"
            >
              重试
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
