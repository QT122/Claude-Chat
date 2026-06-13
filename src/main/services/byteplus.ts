import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { app, net } from 'electron'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const Signer = require('@volcengine/openapi/lib/base/sign').default
const { queryParamsToString } = require('@volcengine/openapi/lib/base/sign') as { queryParamsToString: (params: Record<string, string>) => string }

const ARK_BASE = 'https://ark.cn-beijing.volces.com/api/v3'

// Model IDs
const VISION_MODEL = 'doubao-seed-2-0-lite-260215'
const IMAGE_GEN_MODEL = 'doubao-seedream-4-5-251128'
const VIDEO_GEN_MODEL = 'doubao-seedance-2-0-260409'

export interface ByteplusUsage {
  totalSpend: string
  currency: string
  billPeriod: string
  details: Array<{ product: string; amount: string }>
}

export async function queryByteplusUsage(
  accessKeyId: string,
  secretAccessKey: string,
  billPeriod?: string
): Promise<ByteplusUsage> {
  const period = billPeriod || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`

  const body = JSON.stringify({ BillPeriod: period, Limit: 50, Offset: 0 })
  const params: Record<string, string> = {
    Action: 'ListBillOverviewByProd',
    Version: '2022-01-01',
  }

  const host = 'open.volcengineapi.com'

  const request = {
    region: 'cn-north-1',
    method: 'POST',
    params,
    headers: {
      'Content-Type': 'application/json',
      'Host': host,
    },
    body,
  }

  const signer = new Signer(request, 'billing')
  signer.addAuthorization({
    accessKeyId,
    secretKey: secretAccessKey,
  })

  const qs = queryParamsToString(params)

  // net.fetch can't have explicit Host header, so strip it for the actual request
  const fetchHeaders: Record<string, string> = {}
  for (const [k, v] of Object.entries(request.headers)) {
    if (k.toLowerCase() !== 'host') fetchHeaders[k] = v as string
  }

  const resp = await net.fetch(`https://${host}/?${qs}`, {
    method: 'POST',
    headers: fetchHeaders,
    body,
  })

  if (!resp.ok) {
    const raw = await resp.text().catch(() => '')
    let msg = `HTTP ${resp.status}`
    try {
      const j = JSON.parse(raw)
      const e = j?.ResponseMetadata?.Error
      if (e) msg = `${e.Code}: ${e.Message}`
      else msg += `: ${raw.slice(0, 200)}`
    } catch {
      msg += `: ${raw.slice(0, 200)}`
    }
    throw new Error(msg)
  }

  const data = await resp.json() as {
    ResponseMetadata?: { Error?: { Code?: string; Message?: string } }
    Result?: { BillOverviewByProd?: Array<{ ProductName?: string; ProductCode?: string; BillAmount?: string }> }
  }

  if (data.ResponseMetadata?.Error) {
    throw new Error(`${data.ResponseMetadata.Error.Code}: ${data.ResponseMetadata.Error.Message}`)
  }

  const billList = data.Result?.BillOverviewByProd || []
  const details = billList.map(d => ({
    product: d.ProductName || d.ProductCode || 'Unknown',
    amount: parseFloat(d.BillAmount || '0').toFixed(2),
  }))
  const totalSpend = details.reduce((sum, d) => sum + parseFloat(d.amount || '0'), 0).toFixed(2)

  return { totalSpend, currency: 'CNY', billPeriod: period, details }
}

/**
 * Try to query usage via Ark API directly (using API Key Bearer token).
 */
export async function queryArkUsage(apiKey: string): Promise<ByteplusUsage> {
  const endpoints = ['/usage', '/billing/usage']

  for (const ep of endpoints) {
    try {
      const resp = await net.fetch(`${ARK_BASE}${ep}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(5000),
      })
      if (resp.ok) {
        const data = await resp.json() as Record<string, unknown>
        const d = data as any
        const total = d?.total_spend || d?.totalSpend || d?.total_amount || '0'
        const items = d?.details || d?.items || []
        return {
          totalSpend: String(total),
          currency: 'CNY',
          billPeriod: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
          details: Array.isArray(items) ? items.map((item: any) => ({
            product: item.product || item.service || item.name || 'Unknown',
            amount: String(item.amount || item.cost || item.spend || '0'),
          })) : [],
        }
      }
    } catch {
      // try next
    }
  }

  throw new Error('ARK_USAGE_NOT_FOUND')
}

function getMediaDir(): string {
  const dir = join(app.getPath('userData'), 'generated')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

export interface BytePlusConfig {
  apiKey: string
}

function headers(apiKey: string) {
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  }
}

export async function describeImages(
  imageBase64List: Array<{ name: string; mime: string; data: string }>,
  apiKey: string
): Promise<string> {
  const content: Array<Record<string, unknown>> = []

  for (const img of imageBase64List) {
    content.push({
      type: 'image_url',
      image_url: { url: `data:${img.mime};base64,${img.data}` },
    })
  }

  const imageCount = imageBase64List.length === 1 ? '这张图片' : `这${imageBase64List.length}张图片`
  content.push({
    type: 'text',
    text: `请详细描述${imageCount}的内容。如果是照片，描述场景、物体、人物、颜色、光线、构图等。如果是文档/截图，描述其中的文字和布局。用中文回答。`,
  })

  const resp = await net.fetch(`${ARK_BASE}/chat/completions`, {
    method: 'POST',
    headers: headers(apiKey),
    body: JSON.stringify({
      model: VISION_MODEL,
      messages: [{ role: 'user', content }],
    }),
  })

  if (!resp.ok) {
    const err = await resp.text().catch(() => '')
    throw new Error(`Vision API error ${resp.status}: ${err}`)
  }

  const data = await resp.json() as { choices?: Array<{ message?: { content?: string } }> }
  return data.choices?.[0]?.message?.content?.trim() ?? ''
}

export async function generateImage(prompt: string, apiKey: string): Promise<string> {
  const resp = await net.fetch(`${ARK_BASE}/images/generations`, {
    method: 'POST',
    headers: headers(apiKey),
    body: JSON.stringify({
      model: IMAGE_GEN_MODEL,
      prompt,
      size: '2560x1440',
      response_format: 'b64_json',
      watermark: false,
    }),
  })

  if (!resp.ok) {
    const err = await resp.text().catch(() => '')
    throw new Error(`Image generation API error ${resp.status}: ${err}`)
  }

  const rawText = await resp.text()
  let data: { data?: Array<{ b64_json?: string; url?: string }> }
  try {
    data = JSON.parse(rawText)
  } catch {
    throw new Error(`Failed to parse image API response: ${rawText.slice(0, 200)}`)
  }

  const filename = `img_${Date.now()}.png`
  const filePath = join(getMediaDir(), filename)

  const b64 = data.data?.[0]?.b64_json
  if (b64) {
    writeFileSync(filePath, Buffer.from(b64, 'base64'))
    return `local-img://./${filename}`
  }

  const imageUrl = data.data?.[0]?.url
  if (imageUrl) {
    const downloadResp = await net.fetch(imageUrl)
    if (!downloadResp.ok) throw new Error(`Failed to download generated image: HTTP ${downloadResp.status}`)
    const buffer = Buffer.from(await downloadResp.arrayBuffer())
    writeFileSync(filePath, buffer)
    return `local-img://./${filename}`
  }

  throw new Error(`No image data in response: ${rawText.slice(0, 300)}`)
}

async function createVideoTask(
  prompt: string,
  apiKey: string,
  imageBase64?: string
): Promise<string> {
  const content: Array<Record<string, unknown>> = [
    { type: 'text', text: prompt },
  ]

  if (imageBase64) {
    content.push({
      type: 'image_url',
      image_url: { url: `data:image/png;base64,${imageBase64}` },
      role: 'first_frame',
    })
  }

  const resp = await net.fetch(`${ARK_BASE}/contents/generations/tasks`, {
    method: 'POST',
    headers: headers(apiKey),
    body: JSON.stringify({
      model: VIDEO_GEN_MODEL,
      content,
      resolution: '720p',
      duration: 5,
    }),
  })

  if (!resp.ok) {
    const err = await resp.text().catch(() => '')
    throw new Error(`Video task creation error ${resp.status}: ${err}`)
  }

  const data = await resp.json() as { id?: string }
  if (!data.id) throw new Error('No task ID in video creation response')
  return data.id
}

async function pollVideoTask(taskId: string, apiKey: string): Promise<string> {
  const maxAttempts = 60
  for (let i = 0; i < maxAttempts; i++) {
    const resp = await net.fetch(
      `${ARK_BASE}/contents/generations/tasks/${taskId}`,
      { headers: headers(apiKey) }
    )

    if (!resp.ok) {
      const err = await resp.text().catch(() => '')
      throw new Error(`Video task poll error ${resp.status}: ${err}`)
    }

    const data = await resp.json() as {
      status?: string
      content?: { video_url?: string }
    }

    if (data.status === 'succeeded') {
      if (!data.content?.video_url) throw new Error('No video URL in completed task')
      return data.content.video_url
    }

    if (data.status === 'failed' || data.status === 'cancelled') {
      throw new Error(`Video generation ${data.status}`)
    }

    await new Promise((r) => setTimeout(r, 5000))
  }
  throw new Error('Video generation timed out')
}

export async function generateVideo(
  prompt: string,
  apiKey: string,
  imageBase64?: string
): Promise<string> {
  const taskId = await createVideoTask(prompt, apiKey, imageBase64)
  const videoUrl = await pollVideoTask(taskId, apiKey)

  const videoResp = await net.fetch(videoUrl, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(120000),
  })
  if (!videoResp.ok) throw new Error(`Failed to download video: HTTP ${videoResp.status}`)

  const buffer = Buffer.from(await videoResp.arrayBuffer())
  const filename = `vid_${Date.now()}.mp4`
  writeFileSync(join(getMediaDir(), filename), buffer)
  return `local-img://${filename}`
}
