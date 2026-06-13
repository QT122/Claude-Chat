import { useState, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'

const QUOTES = [
  '每一个不曾起舞的日子，都是对生命的辜负。',
  '你不需要很厉害才能开始，但你需要开始才会很厉害。',
  '星光不问赶路人，时光不负有心人。',
  '世界上只有一种真正的英雄主义，那就是认清生活真相后依然热爱生活。',
  '不要因为走得太远，而忘记为什么出发。',
  '种一棵树最好的时间是十年前，其次是现在。',
  '人生没有白走的路，每一步都算数。',
  '你要相信自己，你比想象中更强大。',
  '今天也是充满希望的一天，加油！',
  '生活明朗，万物可爱，人间值得，未来可期。',
  '别害怕失败，每一次跌倒都是为了更好地起跳。',
  '即使最微弱的光，也能照亮前行的路。',
  '你所热爱的，就是你的生活。',
  '慢慢来，会好的，你又不差。',
  '心之所向，素履以往；生如逆旅，一苇以航。',
  '不必行色匆匆，不必光芒四射，不必成为别人，只需做自己。',
  '世界上美好的东西不太多，立秋傍晚从河对岸吹来的风，和二十来岁笑起来要人命的你。',
  '愿你历尽千帆，归来仍是少年。',
  '温柔是宝藏，你也是。',
  '愿你被这个世界温柔以待，愿你温柔以待这个世界。',
  '凡是过往，皆为序章。',
  '山有顶峰，湖有彼岸，万物皆有回转。',
  '若你决定灿烂，山无遮，海无拦。',
  '最好的状态是未来可期。',
  '发光不是太阳的权利，你也可以。',
  '别否定自己，你特别好，特别值得。',
  '只要心中有光，哪里都是方向。',
  '请保持热爱，奔赴下一场山海。',
  '在无人问津的日子里悄悄努力，在万众瞩目的时刻惊艳所有人。',
  '日落尤其温柔，人间皆是浪漫。',
  '愿你眼中有星辰，心中有山海。',
  '别慌，月亮也曾在某个夜晚迷茫。',
]

export default function QuoteOverlay({ onClose }: { onClose: () => void }) {
  const [quote, setQuote] = useState('')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Pick random quote
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)])
    // Trigger enter animation
    requestAnimationFrame(() => setVisible(true))
  }, [])

  const handleClose = useCallback(() => {
    setVisible(false)
    setTimeout(onClose, 300)
  }, [onClose])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Quote card */}
      <div
        className={`relative max-w-md mx-4 p-8 rounded-2xl bg-gradient-to-br from-violet-900/95 via-gray-900/95 to-indigo-900/95 border border-violet-500/30 shadow-2xl transition-all duration-500 ${
          visible
            ? 'scale-100 opacity-100 translate-y-0'
            : 'scale-90 opacity-0 translate-y-4'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-1 rounded-full text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={16} />
        </button>

        {/* Decorative sparkles */}
        <div className="absolute -top-3 -left-3 w-6 h-6 rounded-full bg-violet-400/30 animate-ping" />
        <div className="absolute -bottom-2 -right-2 w-4 h-4 rounded-full bg-indigo-400/30 animate-ping" style={{ animationDelay: '0.3s' }} />
        <div className="absolute top-1/2 -right-4 w-3 h-3 rounded-full bg-pink-400/20 animate-ping" style={{ animationDelay: '0.6s' }} />

        {/* Quote mark */}
        <div className="text-5xl text-violet-500/40 font-serif leading-none mb-2">
          &ldquo;
        </div>

        {/* Quote text */}
        <p
          className="text-lg text-gray-200 leading-relaxed tracking-wide"
          style={{ textIndent: '0.5em' }}
        >
          {quote}
        </p>

        {/* Heart */}
        <div className="mt-4 flex justify-end">
          <span className="text-violet-400/60 text-2xl animate-pulse">♥</span>
        </div>

        {/* Subtle hint */}
        <p className="text-center text-[10px] text-gray-600 mt-3 select-none">
          Esc 或点击任意处关闭
        </p>
      </div>
    </div>
  )
}
