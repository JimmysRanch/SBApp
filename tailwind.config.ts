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
          light: '#A855F7',
          DEFAULT: '#7C3AED',
          dark: '#5B21B6'
        },
        secondary: {
          DEFAULT: '#F97316',
          dark: '#EA580C',
          pink: '#F472B6',
          purple: '#C084FC',
          green: '#34D399'
        },
        brand: {
          sky: '#38BDF8',
          blue: '#0B1220',
          navy: '#E2E8F0',
          bubble: '#22D3EE',
          bubbleDark: '#0EA5E9',
          mint: '#4ADE80',
          lavender: '#C084FC',
          sunshine: '#FACC15',
          cream: '#F8FAFC'
        }
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        soft: '0 30px 70px -35px rgba(14, 165, 233, 0.4), 0 18px 55px -35px rgba(124, 58, 237, 0.35)'
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
