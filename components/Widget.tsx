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
  blue: 'bg-[linear-gradient(135deg,rgba(16,24,47,0.95),rgba(65,100,255,0.58))]',
  pink: 'bg-[linear-gradient(135deg,rgba(18,28,48,0.95),rgba(56,242,255,0.5))]',
  purple: 'bg-[linear-gradient(135deg,rgba(18,26,46,0.95),rgba(139,92,246,0.55))]',
  green: 'bg-[linear-gradient(135deg,rgba(16,32,36,0.95),rgba(45,212,191,0.55))]'
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
        'relative overflow-hidden rounded-3xl border border-white/15 text-brand-navy shadow-soft backdrop-blur-2xl',
        gradient,
        className
      )}
    >
      <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,_rgba(76,201,240,0.25),_transparent_65%)] blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-30%] left-[-20%] h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(139,92,246,0.18),_transparent_70%)] blur-[160px]" />
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
