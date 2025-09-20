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
  blue: 'bg-gradient-to-br from-brand-onyx via-[#16213A] to-[#2C3F80]',
  pink: 'bg-gradient-to-br from-brand-bubble/80 via-[#3B1432] to-brand-onyx',
  purple: 'bg-gradient-to-br from-[#1C1C52] via-[#342A7C] to-[#101731]',
  green: 'bg-gradient-to-br from-[#08252C] via-[#115055] to-[#0A1920]'
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
        'relative overflow-hidden rounded-3xl border border-white/12 text-brand-cream shadow-[0_40px_120px_-60px_rgba(5,12,32,0.95)] backdrop-blur-2xl',
        gradient,
        className
      )}
    >
      <div className="pointer-events-none absolute -right-24 -top-28 h-60 w-60 rounded-full bg-white/10 blur-[160px]" />
      <div className="pointer-events-none absolute bottom-[-35%] left-[-22%] h-80 w-80 rounded-full bg-brand-bubble/15 blur-[220px]" />
      {!hideHeader && (
        <div className="relative flex items-center justify-between px-5 pt-5">
          <h2 className="text-base font-semibold tracking-tight text-brand-cream drop-shadow-md">{title}</h2>
          {headerContent}
        </div>
      )}
      <div className={clsx('relative px-5 pb-5', hideHeader ? 'pt-5' : 'pt-4')}>
        {children}
      </div>
    </div>
  )
}