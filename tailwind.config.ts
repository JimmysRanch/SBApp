import type { Config } from 'tailwindcss'

const withOpacity = (variable: string) => {
  return ({ opacityValue }: { opacityValue?: string }) => {
    if (opacityValue === undefined) {
      return `rgb(var(${variable}))`
    }
    return `rgb(var(${variable}) / ${opacityValue})`
  }
}

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
          DEFAULT: withOpacity('--sb-primary') as any,
          700: withOpacity('--sb-primary-700') as any
        },
        accent: {
          DEFAULT: withOpacity('--sb-accent') as any,
          700: withOpacity('--sb-accent-700') as any
        },
        surface: withOpacity('--sb-surface') as any,
        muted: withOpacity('--sb-muted') as any,
        text: withOpacity('--sb-text') as any,
        info: withOpacity('--info') as any,
        success: withOpacity('--success') as any,
        warn: withOpacity('--warn') as any,
        danger: withOpacity('--danger') as any,
        progress: withOpacity('--progress') as any
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
