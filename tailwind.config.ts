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
          light: '#63C4FF',
          DEFAULT: '#1E7BFF',
          dark: '#0F4ED7'
        },
        secondary: {
          DEFAULT: '#FF66C4',
          dark: '#FF3D9E',
          pink: '#FF66C4',
          purple: '#7C5CFF',
          green: '#2CD4A6'
        },
        brand: {
          sky: '#5CC2FF',
          blue: '#1A6BFF',
          navy: '#08245A',
          bubble: '#FF66C4',
          bubbleDark: '#FF3D9E',
          mint: '#31D8AF',
          lavender: '#7C5CFF',
          sunshine: '#FFD166',
          cream: '#F9FBFF'
        },
        electric: {
          pink: '#FF3CAC',
          purple: '#784BA0',
          blue: '#2B86C5',
          lime: '#B9FF38',
          aqua: '#1BE7FF',
          orange: '#FF8A05'
        }
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        soft: '0 24px 55px -25px rgba(20, 90, 200, 0.55)',
        hyper: '0 28px 65px -20px rgba(120, 92, 255, 0.55)'
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