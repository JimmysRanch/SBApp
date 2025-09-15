export const cssVariables: Record<string, string> = {
  '--sb-bg': 'linear-gradient(to bottom, #0b5fff, #19a2ff)',
  '--sb-primary': '11 95 255',
  '--sb-primary-700': '8 75 204',
  '--sb-accent': '255 58 166',
  '--sb-accent-700': '204 46 132',
  '--sb-surface': '255 255 255',
  '--sb-muted': '242 246 255',
  '--sb-text': '15 23 42',
  '--info': '59 130 246',
  '--success': '16 185 129',
  '--warn': '245 158 11',
  '--danger': '239 68 68',
  '--progress': '168 85 247',
  '--radius-sm': '8px',
  '--radius-md': '14px',
  '--radius-lg': '22px',
  '--radius-pill': '9999px',
  '--shadow-card': '0 8px 24px rgba(2, 6, 23, 0.08)'
}

export const theme = {
  colors: {
    primary: 'rgb(var(--sb-primary))',
    primary700: 'rgb(var(--sb-primary-700))',
    accent: 'rgb(var(--sb-accent))',
    accent700: 'rgb(var(--sb-accent-700))',
    surface: 'rgb(var(--sb-surface))',
    muted: 'rgb(var(--sb-muted))',
    text: 'rgb(var(--sb-text))',
    status: {
      info: 'rgb(var(--info))',
      success: 'rgb(var(--success))',
      warn: 'rgb(var(--warn))',
      danger: 'rgb(var(--danger))',
      progress: 'rgb(var(--progress))'
    }
  },
  radii: {
    sm: 'var(--radius-sm)',
    md: 'var(--radius-md)',
    lg: 'var(--radius-lg)',
    pill: 'var(--radius-pill)'
  },
  shadows: {
    card: 'var(--shadow-card)'
  }
}

export const useThemeTokens = () => theme

export default theme
