import { ReactNode } from 'react'
import clsx from 'clsx'

interface WidgetProps {
  title: string
  color?: 'blue' | 'pink' | 'purple' | 'green'
  children: ReactNode
  className?: string
  hideHeader?: boolean
  headerContent?: ReactNode
}

const backgroundMap: Record<Required<WidgetProps>['color'], string> = {
  blue: 'bg-gradient-to-br from-brand-oceanDark via-brand-ocean to-brand-oceanLight',
  pink: 'bg-gradient-to-br from-brand-bubble to-brand-bubbleDark',
  purple: 'bg-gradient-to-br from-brand-lavender via-brand-indigoGlow to-primary',
  green: 'bg-gradient-to-br from-brand-mint via-brand-mintBright to-brand-mintLuminous'
}

export default function Widget({
  title,
  color = 'blue',
  children,
  className,
  hideHeader = false,
  headerContent
}: WidgetProps) {
  const gradient = backgroundMap[color]

  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-5xl border border-border-contrast text-text-inverse shadow-elevation-lg backdrop-blur-xl',
        gradient,
        className
      )}
    >
      <div className="pointer-events-none absolute -right-space-4xl -top-space-5xl h-space-7xl w-space-7xl rounded-full bg-surface-overlay blur-glow" />
      <div className="pointer-events-none absolute bottom-[-30%] left-[-20%] h-space-8xl w-space-8xl rounded-full bg-surface-glass blur-halo" />
      {!hideHeader && (
        <div className="relative flex items-center justify-between px-space-lg pt-space-lg">
          <h2 className="text-title-sm font-emphasis tracking-tight drop-shadow-md">{title}</h2>
          {headerContent}
        </div>
      )}
      <div className={clsx('relative px-space-lg pb-space-lg', hideHeader ? 'pt-space-lg' : 'pt-space-md')}>
        {children}
      </div>
    </div>
  )
}
