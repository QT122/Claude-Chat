import { Component } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'

interface Props {
  content: string
  components?: Record<string, any>
}

interface State {
  crashed: boolean
}

export default class SafeMarkdown extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { crashed: false }
  }

  componentDidCatch(error: Error) {
    this.setState({ crashed: true })
  }

  render() {
    if (this.state.crashed) {
      return <pre className="whitespace-pre-wrap text-sm text-gray-300">{this.props.content.slice(0, 20000)}</pre>
    }

    const displayContent = this.props.content.length > 30000
      ? this.props.content.slice(0, 30000) + '\n\n... (内容过长已截断)'
      : this.props.content

    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={this.props.components}
      >
        {displayContent}
      </ReactMarkdown>
    )
  }
}
