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
          light: '#6F9BFF',
          DEFAULT: '#4164FF',
          dark: '#2338EB'
        },
        secondary: {
          DEFAULT: '#38F2FF',
          dark: '#1496AD',
          pink: '#EC4899',
          purple: '#8B5CF6',
          green: '#2DD4BF'
        },
        brand: {
          sky: '#4CC9F0',
          blue: '#10182F',
          navy: '#E6ECFF',
          bubble: '#38F2FF',
          bubbleDark: '#1FA4F2',
          mint: '#2DD4BF',
          lavender: '#8B5CF6',
          sunshine: '#FACC6B',
          cream: '#9BA3B5',
          graphite: '#0B0F19',
          steel: '#1C2433'
        }
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        soft: '0 40px 80px -35px rgba(8, 15, 40, 0.8)'
      },
      borderRadius: {
        '3xl': '1.75rem',
        '4xl': '2.5rem'
      }
    }
  },
  plugins: []
}

export default config
