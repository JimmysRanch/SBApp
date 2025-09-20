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
          light: '#8A7DFF',
          DEFAULT: '#6050FF',
          dark: '#3A29C6'
        },
        secondary: {
          DEFAULT: '#FF7AB8',
          dark: '#E24A96',
          pink: '#FF7AB8',
          purple: '#A07BFF',
          green: '#4ADE80'
        },
        brand: {
          sky: '#6FE3FF',
          blue: '#4330FF',
          navy: '#050311',
          bubble: '#FF7AB8',
          bubbleDark: '#E24A96',
          mint: '#5DF5CF',
          lavender: '#A07BFF',
          sunshine: '#FACC15',
          cream: '#F7F3FF'
        }
      },
      backgroundImage: {
        'aurora-primary':
          'radial-gradient(circle at 20% 20%, rgba(95,80,255,0.45), transparent 55%), radial-gradient(circle at 80% 10%, rgba(111,227,255,0.4), transparent 50%), radial-gradient(circle at 50% 80%, rgba(255,122,184,0.35), transparent 60%)'
      },
      boxShadow: {
        soft: '0 30px 60px -28px rgba(67,48,255,0.55), 0 20px 45px -25px rgba(5,3,17,0.65)',
        glow: '0 0 35px rgba(111,227,255,0.35)'
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif']
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
