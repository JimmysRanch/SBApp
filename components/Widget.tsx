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
  blue: 'from-[#2563EB]/40 via-[#312E81]/70 to-[#0B1220]/90',
  pink: 'from-[#F472B6]/45 via-[#BE185D]/65 to-[#0B1220]/90',
  purple: 'from-[#C084FC]/45 via-[#7C3AED]/65 to-[#0B1220]/90',
  green: 'from-[#34D399]/40 via-[#047857]/65 to-[#0B1220]/90'
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
        'relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-gradient-to-br px-6 py-5 text-brand-navy shadow-[0_35px_80px_-40px_rgba(15,23,42,0.9)] backdrop-blur-2xl',
        gradient,
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.25),transparent_60%)] opacity-60" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(148,163,184,0.2),transparent_65%)] opacity-60" />
      {!hideHeader && (
        <div className="relative flex items-center justify-between pb-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-brand-cream/90 drop-shadow">
            {title}
          </h2>
          {headerContent}
        </div>
      )}
      <div className={clsx('relative', hideHeader ? 'pt-1' : 'pt-2')}>{children}</div>
    </div>
  )
}
