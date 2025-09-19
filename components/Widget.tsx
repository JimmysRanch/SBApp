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

const accentBackground: Record<Required<WidgetProps>['color'], string> = {
  blue: 'from-sky-500/15 via-sky-400/10 to-transparent',
  pink: 'from-rose-400/20 via-rose-300/10 to-transparent',
  purple: 'from-violet-500/20 via-violet-400/10 to-transparent',
  green: 'from-emerald-400/20 via-emerald-300/10 to-transparent'
}

export default function Widget({
  title,
  color = 'blue',
  children,
  className,
  hideHeader = false,
  headerContent
}: WidgetProps) {
  const gradient = accentBackground[color]

  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-3xl border border-slate-200 bg-white text-brand-charcoal shadow-xl shadow-slate-200/60 backdrop-blur',
        className
      )}
    >
      <div className={clsx('pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br', gradient)} />
      <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-white/40 blur-[120px]" />
      <div className="pointer-events-none absolute -left-24 bottom-[-6rem] h-60 w-60 rounded-full bg-white/30 blur-[140px]" />
      {!hideHeader && (
        <div className="relative flex items-center justify-between px-6 pt-6">
          <h2 className="text-lg font-semibold text-brand-charcoal">{title}</h2>
          {headerContent}
        </div>
      )}
      <div className={clsx('relative px-6 pb-6', hideHeader ? 'pt-6' : 'pt-4')}>
        {children}
      </div>
    </div>
  )
}
