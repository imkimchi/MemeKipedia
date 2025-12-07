import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#a855f7',
        secondary: '#98fce5',
        background: '#0f172a',
        surface: '#1e293b',
      },
    },
  },
  plugins: [],
}
export default config
