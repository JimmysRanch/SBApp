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
          light: '#4A6CF7',
          DEFAULT: '#2B46F2',
          dark: '#1C2EBF'
        },
        secondary: {
          DEFAULT: '#FF0A78',
          dark: '#C1005C',
          pink: '#FF0A78',
          purple: '#6C4DFF',
          green: '#18C7B9'
        },
        brand: {
          sky: '#2033B7',
          blue: '#132246',
          navy: '#E3E7F8',
          bubble: '#FF0A78',
          bubbleDark: '#C1005C',
          mint: '#1BC9B7',
          lavender: '#6C4DFF',
          sunshine: '#F5B85A',
          cream: '#F6F7FF',
          midnight: '#05060F',
          onyx: '#0B1120',
          steel: '#11192C',
          frost: '#BCC3DA'
        }
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        soft: '0 34px 90px -40px rgba(5, 12, 32, 0.85)'
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