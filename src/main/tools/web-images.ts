import type { ToolDefinition } from './base'

const MAX_IMAGES = 6

async function searchImages(query: string): Promise<string[]> {
  // Step 1: Get vqd token from DuckDuckGo
  const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`

  const pageResp = await fetch(searchUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml',
    },
  })

  const html = await pageResp.text()

  // Extract vqd token
  const vqdMatch = html.match(/vqd=([\d-]+)/)
  const vqd = vqdMatch ? vqdMatch[1] : null

  if (!vqd) {
    throw new Error('无法获取搜索令牌')
  }

  // Step 2: Fetch image results via i.js API
  const apiUrl = `https://duckduckgo.com/i.js?q=${encodeURIComponent(query)}&vqd=${vqd}&p=1&s=0&o=json`

  const apiResp = await fetch(apiUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
      'Referer': 'https://duckduckgo.com/',
    },
  })

  const data = await apiResp.json() as { results: Array<{ image: string; title: string }> }

  if (!data.results || data.results.length === 0) {
    return []
  }

  // Extract unique image URLs
  const urls: string[] = []
  for (const r of data.results) {
    if (r.image && !urls.includes(r.image) && urls.length < MAX_IMAGES) {
      urls.push(r.image)
    }
  }

  return urls
}

export const webImagesTool: ToolDefinition = {
  name: 'web_images',
  displayName: '搜图',
  description: 'Search the web for images. Returns direct image URLs that will be displayed inline. Use this when the user asks to see pictures or photos of something. Always use this tool when the user wants to see images.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The image search query in English or Chinese',
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
      const urls = await searchImages(query)

      if (urls.length === 0) {
        return { content: `未找到与 "${query}" 相关的图片。` }
      }

      // Return images as markdown with download links
      const lines = urls.map((url, i) =>
        `![图片${i + 1}](${url})\n[下载图片${i + 1}](${url})`
      )

      return {
        content: `搜索 "${query}" 的结果:\n\n${lines.join('\n\n')}`,
        metadata: { query, count: urls.length },
      }
    } catch (err) {
      return {
        content: `图片搜索出错: ${err instanceof Error ? err.message : String(err)}`,
        isError: true,
      }
    }
  },
}
