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
  blue: 'bg-[linear-gradient(135deg,rgba(5,7,18,0.95)_0%,rgba(29,77,255,0.85)_45%,rgba(99,196,255,0.9)_100%)]',
  pink: 'bg-[linear-gradient(135deg,rgba(5,7,18,0.95)_0%,rgba(255,102,196,0.9)_52%,rgba(255,61,158,0.88)_100%)]',
  purple: 'bg-[linear-gradient(135deg,rgba(5,7,18,0.95)_0%,rgba(124,92,255,0.85)_48%,rgba(30,123,255,0.85)_100%)]',
  green: 'bg-[linear-gradient(135deg,rgba(5,7,18,0.95)_0%,rgba(49,216,175,0.85)_45%,rgba(67,240,197,0.85)_100%)]'
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
        'relative overflow-hidden rounded-3xl border border-white/10 text-white shadow-[0_40px_90px_-45px_rgba(5,10,45,0.9)] backdrop-blur-xl',
        gradient,
        className
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      <div className="pointer-events-none absolute -right-24 -top-28 h-64 w-64 rounded-full bg-white/12 blur-[150px]" />
      <div className="pointer-events-none absolute bottom-[-35%] left-[-20%] h-80 w-80 rounded-full bg-brand-obsidian/70 blur-[220px]" />
      {!hideHeader && (
        <div className="relative flex items-center justify-between px-5 pt-5">
          <h2 className="text-base font-semibold tracking-tight drop-shadow-md">{title}</h2>
          {headerContent}
        </div>
      )}
      <div className={clsx('relative px-5 pb-5', hideHeader ? 'pt-5' : 'pt-4')}>
        {children}
      </div>
    </div>
  )
}