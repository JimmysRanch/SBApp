import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#60A5FA',
          DEFAULT: '#2563EB',
          dark: '#1D4ED8'
        },
        secondary: {
          DEFAULT: '#0EA5E9',
          dark: '#0284C7',
          moss: '#0F172A',
          sage: '#14B8A6'
        },
        brand: {
          sky: '#38BDF8',
          blue: '#1E3A8A',
          navy: '#0B1220',
          bubble: '#6366F1',
          bubbleDark: '#4F46E5',
          mint: '#14B8A6',
          lavender: '#8B5CF6',
          sunshine: '#F59E0B',
          cream: '#F8FAFC',
          slate: '#1F2937',
          graphite: '#111827',
          hotpink: '#F472B6'
        }
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        soft: '0 24px 55px -25px rgba(37, 99, 235, 0.45)'
      },
      borderRadius: {
        '3xl': '1.75rem',
        '4xl': '2.5rem'
      }
    }
  },
  plugins: []
};

export default config;
