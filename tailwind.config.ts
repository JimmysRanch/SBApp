import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#c084fc',
          DEFAULT: '#a855f7',
          dark: '#7e22ce'
        },
        secondary: {
          pink: '#ec4899',
          purple: '#8b5cf6',
          green: '#14b8a6'
        }
      }
    }
  },
  plugins: []
}

export default config
