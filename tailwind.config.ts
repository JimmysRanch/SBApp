import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#f5f5f0',
          DEFAULT: '#d4af37',
          dark: '#1a1f2b'
        },
        accent: {
          DEFAULT: '#0e9aa7',
          dark: '#0a7a83'
        }
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'sans-serif'],
        serif: ['var(--font-serif)', 'serif']
      }
    }
  },
  plugins: []
}

export default config

