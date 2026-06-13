import type { ToolDefinition } from './base'

const SEARCH_URL = 'https://html.duckduckgo.com/html/'
const MAX_RESULTS = 8

interface SearchResult {
  title: string
  url: string
  snippet: string
}

async function searchDuckDuckGo(query: string): Promise<SearchResult[]> {
  const response = await fetch(SEARCH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    body: new URLSearchParams({ q: query, b: '' }).toString(),
  })

  if (!response.ok) {
    throw new Error(`搜索请求失败: ${response.status} ${response.statusText}`)
  }

  const html = await response.text()
  const results: SearchResult[] = []

  // Parse DuckDuckGo HTML results
  const resultRegex = /<a rel="nofollow" class="result__a" href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([^<]*(?:<(?!\/a>)[^<]*)*)<\/a>/gi
  let match

  while ((match = resultRegex.exec(html)) !== null && results.length < MAX_RESULTS) {
    const url = decodeURIComponent(match[1].replace(/\/\/duckduckgo\.com\/l\/\?uddg=/, '').split('&rut=')[0])
    const title = cleanHtml(match[2])
    const snippet = cleanHtml(match[3])
    if (title && snippet) {
      results.push({ title, url, snippet })
    }
  }

  return results
}

function cleanHtml(str: string): string {
  return str
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .trim()
}

export const webSearchTool: ToolDefinition = {
  name: 'web_search',
  displayName: '联网搜索',
  description: 'Search the web for current information. Use this when you need up-to-date facts, recent news, or information beyond your knowledge cutoff. Returns titles, URLs, and snippets from search results.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query string',
      },
    },
    required: ['query'],
  },

  async execute(input) {
    const query = (input.query as string)?.trim()

    if (!query) {
      return { content: '请提供搜索关键词', isError: true }
    }

    try {
      const results = await searchDuckDuckGo(query)

      if (results.length === 0) {
        return { content: `未找到与 "${query}" 相关的结果。请尝试其他关键词。` }
      }

      const formatted = results
        .map((r, i) => `${i + 1}. **${r.title}**\n   URL: ${r.url}\n   ${r.snippet}`)
        .join('\n\n')

      return {
        content: `搜索 "${query}" 的结果:\n\n${formatted}\n\n提示: 使用 web_fetch 工具获取某个结果页面的完整内容。`,
        metadata: { query, resultCount: results.length },
      }
    } catch (err) {
      return {
        content: `搜索出错: ${err instanceof Error ? err.message : String(err)}`,
        isError: true,
      }
    }
  },
}
