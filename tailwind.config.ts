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
          light: '#76b2fe',
          DEFAULT: '#4b79a1',
          dark: '#283e51'
        },
        secondary: {
          pink: '#f8b4c0',
          purple: '#dcbcef',
          green: '#b5e5cf'
        }
      }
    }
  },
  plugins: []
}

export default config