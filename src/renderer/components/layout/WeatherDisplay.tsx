import { useState, useEffect, useCallback } from 'react'
import { CloudSun, Loader2, MapPin } from 'lucide-react'

interface WeatherInfo {
  city: string
  areaName: string
  country: string
  temp: string
  feelsLike: string
  desc: string
  humidity: string
  windSpeed: string
}

export default function WeatherDisplay() {
  const [weather, setWeather] = useState<WeatherInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [error, setError] = useState('')
  const [geoGranted, setGeoGranted] = useState(false)

  const fetchWeatherByQuery = useCallback(async (query?: string) => {
    setLoading(true)
    setError('')
    try {
      const result = await window.api.getWeather(query)
      if ('error' in result) {
        setError(result.error || '获取失败')
        setWeather(null)
      } else {
        setWeather(result as WeatherInfo)
        setError('')
      }
    } catch {
      setError('网络错误')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    // Try browser geolocation first
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeoGranted(true)
          fetchWeatherByQuery(`${pos.coords.latitude},${pos.coords.longitude}`)
        },
        () => {
          // Geolocation denied or failed — let main process handle fallback
          setGeoGranted(false)
          fetchWeatherByQuery()
        },
        { timeout: 8000, maximumAge: 600000 }
      )
    } else {
      fetchWeatherByQuery()
    }
  }, [fetchWeatherByQuery])

  // Refresh on expand
  const handleToggle = () => {
    if (!expanded) {
      if (geoGranted && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            fetchWeatherByQuery(`${pos.coords.latitude},${pos.coords.longitude}`)
          },
          () => fetchWeatherByQuery(),
          { timeout: 8000, maximumAge: 600000 }
        )
      } else {
        fetchWeatherByQuery()
      }
    }
    setExpanded(!expanded)
  }

  return (
    <div className="relative" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
      <button
        onClick={handleToggle}
        className="h-10 flex items-center gap-1 px-2 text-xs text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
        title="今日天气"
      >
        {loading ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <CloudSun size={14} className={weather ? 'text-sky-400' : 'text-gray-500'} />
        )}
        {weather && (
          <>
            <span className="text-gray-300">{weather.temp}°C</span>
            {geoGranted && <MapPin size={8} className="text-green-500" />}
          </>
        )}
      </button>

      {expanded && (
        <div className="absolute right-0 top-10 w-56 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-3 z-50">
          {error ? (
            <div className="text-xs text-red-400">
              <p>{error}</p>
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  placeholder="输入城市名..."
                  className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-200 outline-none focus:border-sky-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      fetchWeatherByQuery(e.currentTarget.value.trim())
                    }
                  }}
                />
              </div>
            </div>
          ) : weather ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium text-gray-200">{weather.areaName}</span>
                    {geoGranted && <MapPin size={10} className="text-green-500" />}
                  </div>
                  <span className="text-[10px] text-gray-500">{weather.country}</span>
                </div>
                <span className="text-2xl font-bold text-sky-400">{weather.temp}°C</span>
              </div>
              <div className="text-xs text-gray-400">
                <span>{weather.desc}</span>
                <span className="mx-1">·</span>
                <span>体感 {weather.feelsLike}°C</span>
              </div>
              <div className="flex gap-3 text-[10px] text-gray-500">
                <span>湿度 {weather.humidity}%</span>
                <span>风速 {weather.windSpeed}km/h</span>
              </div>
              <div className="border-t border-gray-800 pt-2">
                <input
                  type="text"
                  placeholder="搜索其他城市..."
                  className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-200 outline-none focus:border-sky-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      fetchWeatherByQuery(e.currentTarget.value.trim())
                    }
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-500">
              <p>加载中...</p>
            </div>
          )}
        </div>
      )}

      {expanded && (
        <div className="fixed inset-0 z-40" onClick={() => setExpanded(false)} />
      )}
    </div>
  )
}
