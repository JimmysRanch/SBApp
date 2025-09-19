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
          light: '#60A5FA',
          DEFAULT: '#2563EB',
          dark: '#1D4ED8'
        },
        secondary: {
          DEFAULT: '#F97316',
          dark: '#EA580C',
          pink: '#F43F5E',
          purple: '#8B5CF6',
          green: '#22C55E'
        },
        brand: {
          sky: '#E0F2FE',
          blue: '#1E3A8A',
          navy: '#0F172A',
          bubble: '#F97316',
          bubbleDark: '#C2410C',
          mint: '#10B981',
          lavender: '#8B5CF6',
          sunshine: '#FACC15',
          cream: '#F8FAFC',
          charcoal: '#1F2937',
          fog: '#E2E8F0'
        }
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        soft: '0 24px 55px -25px rgba(20, 90, 200, 0.55)'
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