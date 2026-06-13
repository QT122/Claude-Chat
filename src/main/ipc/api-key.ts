import { ipcMain, net } from 'electron'
import { storeApiKey, getApiKey, deleteApiKey, isEncryptionAvailable } from '../util/encryption'
import { queryByteplusUsage, queryArkUsage } from '../services/byteplus'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

function getSettingsValue(key: string): string | null {
  return getApiKey(`settings_${key}`)
}

function setSettingsValue(key: string, value: string): void {
  storeApiKey(`settings_${key}`, value)
}

function deleteSettingsValue(key: string): void {
  deleteApiKey(`settings_${key}`)
}

export function registerApiKeyHandlers(): void {
  ipcMain.handle('key:set', (_event, provider: string, apiKey: string) => {
    try {
      if (!isEncryptionAvailable()) {
        return { success: false, error: '系统加密不可用' }
      }
      storeApiKey(provider, apiKey)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('key:get', (_event, provider: string) => {
    try {
      const key = getApiKey(provider)
      return { apiKey: key, configured: key !== null }
    } catch (err) {
      return { apiKey: null, configured: false, error: String(err) }
    }
  })

  ipcMain.handle('key:delete', (_event, provider: string) => {
    try {
      deleteApiKey(provider)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('key:test', async (_event, provider: string, apiKey: string) => {
    try {
      if (provider === 'anthropic') {
        const client = new Anthropic({ apiKey })
        await client.models.list({ limit: 1 })
      } else if (provider === 'deepseek') {
        const client = new OpenAI({ apiKey, baseURL: 'https://api.deepseek.com/v1' })
        await client.models.list()
      } else if (provider === 'openai') {
        const client = new OpenAI({ apiKey })
        await client.models.list()
      } else if (provider === 'byteplus') {
        const resp = await net.fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'doubao-seed-2-0-lite-260215',
            messages: [{ role: 'user', content: 'hi' }],
            max_tokens: 1,
          }),
        })
        if (!resp.ok) {
          const err = await resp.text().catch(() => '')
          throw new Error(`HTTP ${resp.status}: ${err}`)
        }
      }
      return { valid: true }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      return { valid: false, error: message }
    }
  })

  ipcMain.handle('key:usage', async () => {
    const result: {
      deepseek: { balance: string; currency: string } | null
      byteplus: { available: boolean; usage: unknown } | null
    } = { deepseek: null, byteplus: null }

    // DeepSeek balance
    const dsKey = getApiKey('deepseek')
    if (dsKey) {
      try {
        const resp = await net.fetch('https://api.deepseek.com/user/balance', {
          headers: { 'Authorization': `Bearer ${dsKey}` },
        })
        if (resp.ok) {
          const data = await resp.json() as { is_available: boolean; balance_infos?: Array<{ currency: string; total_balance: string }> }
          const info = data.balance_infos?.[0]
          if (info) {
            result.deepseek = { balance: info.total_balance, currency: info.currency }
          }
        }
      } catch { /* ignore */ }
    }

    // Volcano Engine — try Ark API first (simpler Bearer auth), then AK/SK
    const bpKey = getApiKey('byteplus')
    if (bpKey) {
      try {
        // Try Ark API first with API Key
        const usage = await queryArkUsage(bpKey)
        result.byteplus = { available: true, usage }
      } catch {
        // Ark API failed, try AK/SK
        const ak = getSettingsValue('byteplus_ak')
        const sk = getSettingsValue('byteplus_sk')
        if (ak && sk) {
          try {
            const usage = await queryByteplusUsage(ak, sk)
            result.byteplus = { available: true, usage }
          } catch (err) {
            result.byteplus = { available: true, usage: null, error: err instanceof Error ? err.message : String(err) }
          }
        } else {
          result.byteplus = { available: true, usage: null }
        }
      }
    }

    return result
  })

  // BytePlus AK/SK storage
  ipcMain.handle('byteplus:save-aksk', (_event, ak: string, sk: string) => {
    try {
      if (!isEncryptionAvailable()) {
        return { success: false, error: '系统加密不可用' }
      }
      setSettingsValue('byteplus_ak', ak)
      setSettingsValue('byteplus_sk', sk)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('byteplus:get-aksk', () => {
    try {
      const ak = getSettingsValue('byteplus_ak')
      const sk = getSettingsValue('byteplus_sk')
      return { ak, sk, configured: !!(ak && sk) }
    } catch {
      return { ak: null, sk: null, configured: false }
    }
  })

  ipcMain.handle('byteplus:clear-aksk', () => {
    try {
      deleteSettingsValue('byteplus_ak')
      deleteSettingsValue('byteplus_sk')
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('byteplus:query-usage', async (_event, ak: string, sk: string, billPeriod?: string) => {
    try {
      const usage = await queryByteplusUsage(ak, sk, billPeriod)
      return { success: true, usage }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  // Weather
  ipcMain.handle('weather:get', async (_event, city?: string) => {
    try {
      // If a specific query was passed (city name or "lat,lon"), use it directly
      let targetCity = city
      if (!targetCity) {
        // Try IP geolocation — race multiple services
        const geoUrls = [
          'https://ipapi.co/json/',
          'https://ipinfo.io/json',
        ]
        for (const url of geoUrls) {
          try {
            const geoResp = await net.fetch(url, {
              signal: AbortSignal.timeout(4000),
              headers: url.includes('ipinfo') ? {} : {},
            })
            if (geoResp.ok) {
              const geo = await geoResp.json() as { city?: string; region?: string }
              if (geo.city) {
                targetCity = geo.city
                break
              }
            }
          } catch {
            // try next
          }
        }
      }
      if (!targetCity) {
        targetCity = '厦门市集美区'
      }

      const weatherResp = await net.fetch(
        `https://wttr.in/${encodeURIComponent(targetCity)}?format=j1`,
        { signal: AbortSignal.timeout(8000) }
      )
      if (!weatherResp.ok) {
        throw new Error(`Weather API HTTP ${weatherResp.status}`)
      }
      const data = await weatherResp.json() as {
        current_condition?: Array<{
          temp_C?: string
          weatherDesc?: Array<{ value: string }>
          humidity?: string
          windspeedKmph?: string
          FeelsLikeC?: string
        }>
        nearest_area?: Array<{
          areaName?: Array<{ value: string }>
          country?: Array<{ value: string }>
        }>
      }

      const current = data.current_condition?.[0]
      const area = data.nearest_area?.[0]

      return {
        city: targetCity,
        areaName: area?.areaName?.[0]?.value || targetCity,
        country: area?.country?.[0]?.value || '',
        temp: current?.temp_C || '--',
        feelsLike: current?.FeelsLikeC || current?.temp_C || '--',
        desc: current?.weatherDesc?.[0]?.value || '未知',
        humidity: current?.humidity || '--',
        windSpeed: current?.windspeedKmph || '--',
      }
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) }
    }
  })
}
