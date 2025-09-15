import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './styles/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--sb-primary)',
          700: 'var(--sb-primary-700)'
        },
        accent: {
          DEFAULT: 'var(--sb-accent)',
          700: 'var(--sb-accent-700)'
        },
        surface: 'var(--sb-surface)',
        muted: 'var(--sb-muted)',
        text: 'var(--sb-text)',
        info: 'var(--info)',
        success: 'var(--success)',
        warn: 'var(--warn)',
        danger: 'var(--danger)',
        progress: 'var(--progress)'
      },
      borderRadius: {
        sb: 'var(--radius-md)'
      },
      boxShadow: {
        card: 'var(--shadow-card)'
      }
    }
  },
  plugins: []
}

export default config
