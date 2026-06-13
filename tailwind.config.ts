import type { Config } from 'tailwindcss'

export default {
  content: ['./src/renderer/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      colors: {
        sidebar: {
          bg: '#1a1a2e',
          hover: '#16213e',
          active: '#0f3460',
        },
        chat: {
          bg: '#1e1e2e',
          bubble: '#2a2a3e',
        },
      },
    },
  },
  plugins: [],
} satisfies Config
