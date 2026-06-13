import type { ToolDefinition } from './base'

const MAX_CONTENT_LENGTH = 8000

async function fetchPage(url: string): Promise<{ title: string; text: string }> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
    throw new Error(`不支持的内容类型: ${contentType}`)
  }

  const html = await response.text()

  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  const title = titleMatch ? titleMatch[1].trim() : url

  // Extract text content: remove scripts, styles, and HTML tags
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return { title, text }
}

export const webFetchTool: ToolDefinition = {
  name: 'web_fetch',
  displayName: '获取网页',
  description: 'Fetch and extract text content from a web page URL. Use this to read the full content of a page found via web_search, or to check a specific URL for current information. Returns the page title and extracted text.',
  inputSchema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The full URL of the web page to fetch (must start with http:// or https://)',
      },
    },
    required: ['url'],
  },

  async execute(input) {
    const url = (input.url as string)?.trim()

    if (!url) {
      return { content: '请提供网页 URL', isError: true }
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return { content: 'URL 必须以 http:// 或 https:// 开头', isError: true }
    }

    try {
      const { title, text } = await fetchPage(url)

      const truncated = text.length > MAX_CONTENT_LENGTH
        ? text.slice(0, MAX_CONTENT_LENGTH) + `\n\n... (内容已截断，共 ${text.length} 字符)`
        : text

      return {
        content: `**页面标题**: ${title}\n**URL**: ${url}\n\n${truncated}`,
        metadata: { url, title, contentLength: text.length },
      }
    } catch (err) {
      return {
        content: `获取网页失败: ${err instanceof Error ? err.message : String(err)}`,
        isError: true,
      }
    }
  },
}
