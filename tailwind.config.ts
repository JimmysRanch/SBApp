import type { Config } from 'tailwindcss'

export const designTokens = {
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
      cream: '#F9FBFF',
      oceanDark: '#1D4DFF',
      ocean: '#2E8CFF',
      oceanLight: '#55C3FF',
      indigoGlow: '#5B7DFF',
      mintBright: '#3CE0B7',
      mintLuminous: '#43F0C5'
    },
    surface: {
      glass: 'rgba(255, 255, 255, 0.10)',
      hover: 'rgba(255, 255, 255, 0.15)',
      overlay: 'rgba(255, 255, 255, 0.25)',
      frosted: 'rgba(255, 255, 255, 0.85)',
      strong: 'rgba(255, 255, 255, 0.90)'
    },
    border: {
      subtle: 'rgba(255, 255, 255, 0.20)',
      contrast: 'rgba(255, 255, 255, 0.25)',
      strong: 'rgba(255, 255, 255, 0.30)',
      highlight: 'rgba(255, 255, 255, 0.40)'
    },
    text: {
      inverse: '#FFFFFF',
      'inverse-strong': 'rgba(255, 255, 255, 0.90)',
      'inverse-muted': 'rgba(255, 255, 255, 0.80)',
      'inverse-subtle': 'rgba(255, 255, 255, 0.70)'
    }
  },
  spacing: {
    'space-2xs': '0.25rem',
    'space-xs': '0.5rem',
    'space-sm': '0.75rem',
    'space-md': '1rem',
    'space-lg': '1.5rem',
    'space-xl': '2rem',
    'space-2xl': '2.5rem',
    'space-3xl': '3rem',
    'space-4xl': '4rem',
    'space-5xl': '6rem',
    'space-6xl': '10rem',
    'space-7xl': '16rem',
    'space-8xl': '20rem'
  },
  typography: {
    fontSize: {
      'label-xs': ['0.75rem', { lineHeight: '1rem' }],
      'body-sm': ['0.875rem', { lineHeight: '1.35rem' }],
      'body-md': ['1rem', { lineHeight: '1.5rem' }],
      'title-sm': ['1.125rem', { lineHeight: '1.75rem' }],
      'title-md': ['1.5rem', { lineHeight: '1.95rem', letterSpacing: '-0.01em' }],
      'display-sm': ['2rem', { lineHeight: '2.5rem', letterSpacing: '-0.02em' }]
    },
    fontWeight: {
      regular: '400',
      medium: '500',
      emphasis: '600',
      strong: '700',
      display: '800',
      brand: '900'
    },
    letterSpacing: {
      eyebrow: '0.4em',
      brand: '-0.01em',
      wide: '0.08em'
    },
    lineHeight: {
      snug: '1.35',
      relaxed: '1.5'
    }
  },
  elevation: {
    'elevation-xs': '0 6px 18px -10px rgba(8, 36, 90, 0.2)',
    'elevation-sm': '0 12px 30px -12px rgba(8, 36, 90, 0.25)',
    'elevation-md': '0 18px 45px -20px rgba(20, 90, 200, 0.35)',
    'elevation-lg': '0 24px 55px -25px rgba(20, 90, 200, 0.55)'
  },
  effects: {
    blur: {
      glow: '120px',
      halo: '160px'
    }
  }
} satisfies {
  colors: Record<string, unknown>
  spacing: Record<string, string>
  typography: {
    fontSize: Record<string, [string, { lineHeight: string; letterSpacing?: string }]>
    fontWeight: Record<string, string | number>
    letterSpacing: Record<string, string>
    lineHeight: Record<string, string>
  }
  elevation: Record<string, string>
  effects: { blur: Record<string, string> }
};

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: designTokens.colors,
      spacing: designTokens.spacing,
      fontSize: designTokens.typography.fontSize,
      fontWeight: designTokens.typography.fontWeight,
      letterSpacing: designTokens.typography.letterSpacing,
      lineHeight: designTokens.typography.lineHeight,
      boxShadow: designTokens.elevation,
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        '5xl': '2rem',
        '6xl': '2.25rem'
      },
      blur: designTokens.effects.blur
    }
  },
  plugins: []
}

export default config
