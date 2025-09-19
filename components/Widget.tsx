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

const borderGradients: Record<Required<WidgetProps>['color'], string> = {
  blue: 'from-brand-blue/90 via-brand-blue/55 to-brand-sky/30',
  pink: 'from-secondary-pink/80 via-secondary/60 to-brand-sunshine/40',
  purple: 'from-brand-lavender/90 via-brand-blue/60 to-brand-mint/35',
  green: 'from-brand-mint/90 via-brand-mint/55 to-brand-bubble/40'
}

export default function Widget({
  title,
  color = 'blue',
  children,
  className,
  hideHeader = false,
  headerContent
}: WidgetProps) {
  const gradient = borderGradients[color]

  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-[2.6rem] p-[1px] shadow-[0_35px_80px_-45px_rgba(5,12,31,0.9)]',
        className
      )}
    >
      <div className={clsx('absolute inset-0 rounded-[2.6rem] bg-gradient-to-br opacity-90', gradient)} />
      <div className="relative z-10 h-full rounded-[2.45rem] bg-brand-cream/95 px-7 pb-7 pt-6 text-brand-navy shadow-[0_25px_45px_-40px_rgba(8,15,41,0.75)]">
        {!hideHeader && (
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.42em] text-brand-blue/60">Overview</p>
              <h2 className="mt-1 font-serif text-2xl font-semibold text-brand-navy">{title}</h2>
            </div>
            {headerContent && <div className="text-sm text-brand-navy/70">{headerContent}</div>}
          </div>
        )}
        <div className={clsx('space-y-4', hideHeader ? '' : '')}>{children}</div>
      </div>
      <div className="pointer-events-none absolute -left-10 top-1/3 h-40 w-40 rounded-full bg-white/40 blur-[120px] opacity-20" />
      <div className="pointer-events-none absolute -right-10 bottom-0 h-48 w-48 rounded-full bg-white/30 blur-[160px] opacity-10" />
    </div>
  )
}