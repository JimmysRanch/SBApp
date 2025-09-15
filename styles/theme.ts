export const cssVariables: Record<string, string> = {
  '--sb-bg': 'linear-gradient(to bottom, #0b5fff, #19a2ff)',
  '--sb-primary': '#0b5fff',
  '--sb-primary-700': '#084bcc',
  '--sb-accent': '#ff3aa6',
  '--sb-accent-700': '#cc2e84',
  '--sb-surface': '#ffffff',
  '--sb-muted': '#f2f6ff',
  '--sb-text': '#0f172a',
  '--info': '#3b82f6',
  '--success': '#10b981',
  '--warn': '#f59e0b',
  '--danger': '#ef4444',
  '--progress': '#a855f7',
  '--radius-sm': '8px',
  '--radius-md': '14px',
  '--radius-lg': '22px',
  '--radius-pill': '9999px',
  '--shadow-card': '0 8px 24px rgba(2, 6, 23, 0.08)'
}

export const theme = {
  colors: {
    primary: 'var(--sb-primary)',
    primary700: 'var(--sb-primary-700)',
    accent: 'var(--sb-accent)',
    accent700: 'var(--sb-accent-700)',
    surface: 'var(--sb-surface)',
    muted: 'var(--sb-muted)',
    text: 'var(--sb-text)',
    status: {
      info: 'var(--info)',
      success: 'var(--success)',
      warn: 'var(--warn)',
      danger: 'var(--danger)',
      progress: 'var(--progress)'
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
