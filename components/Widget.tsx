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

const gradientMap: Record<Required<WidgetProps>['color'], string> = {
  blue: 'from-electric-blue/80 via-electric-aqua/80 to-electric-purple/85',
  pink: 'from-electric-pink/85 via-electric-orange/80 to-electric-purple/90',
  purple: 'from-brand-lavender/80 via-electric-purple/85 to-electric-pink/85',
  green: 'from-electric-lime/80 via-brand-mint/80 to-electric-aqua/80'
}

const glowMap: Record<Required<WidgetProps>['color'], string> = {
  blue: 'bg-electric-blue/45',
  pink: 'bg-electric-pink/45',
  purple: 'bg-electric-purple/45',
  green: 'bg-electric-lime/45'
}

export default function Widget({
  title,
  color = 'blue',
  children,
  className,
  hideHeader = false,
  headerContent
}: WidgetProps) {
  const gradient = gradientMap[color]
  const glow = glowMap[color]

  return (
    <div
      className={clsx(
        'neon-card bg-gradient-to-br text-white',
        gradient,
        className
      )}
    >
      <div className={clsx('widget-aurora', glow)} />
      <div className="widget-sparkle widget-sparkle--one" />
      <div className="widget-sparkle widget-sparkle--two" />
      {!hideHeader && (
        <div className="relative z-10 flex flex-col gap-4 px-8 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.55em] text-white/70">Spotlight</p>
            <h2 className="font-display text-2xl font-black uppercase tracking-[0.3em] drop-shadow-[0_8px_20px_rgba(0,0,0,0.35)]">
              {title}
            </h2>
          </div>
          {headerContent}
        </div>
      )}
      {!hideHeader && <div className="widget-divider" />}
      <div className={clsx('relative z-10 px-8 pb-8', hideHeader ? 'pt-10' : 'pt-6')}>
        {children}
      </div>
    </div>
  )
}