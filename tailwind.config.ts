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
          light: '#7CC8FF',
          DEFAULT: '#4164F6',
          dark: '#2331B5'
        },
        secondary: {
          DEFAULT: '#F6A92F',
          dark: '#D38416',
          pink: '#EE7A32',
          purple: '#7D6BFF',
          green: '#2BC6A3'
        },
        brand: {
          sky: '#92B4FF',
          blue: '#4D68FF',
          navy: '#050C1F',
          bubble: '#F6A92F',
          bubbleDark: '#D38416',
          mint: '#2BC6A3',
          lavender: '#7D6BFF',
          sunshine: '#F5E6C5',
          cream: '#F7F9FF'
        }
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif']
      },
      boxShadow: {
        soft: '0 35px 80px -35px rgba(32, 56, 150, 0.55)',
        'soft-inner': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.45)'
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