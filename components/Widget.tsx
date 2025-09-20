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
  blue: 'bg-gradient-to-br from-[#3020C9] via-[#4E3AFF] to-[#6FE3FF]',
  pink: 'bg-gradient-to-br from-[#FF6FAF] via-[#F64085] to-[#FFD1E8]',
  purple: 'bg-gradient-to-br from-[#271B9D] via-[#7C5CFF] to-[#FF7AB8]',
  green: 'bg-gradient-to-br from-[#36F9C5] via-[#3ABFF8] to-[#6FE3FF]'
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
        'relative overflow-hidden rounded-[2.65rem] border border-white/15 text-white shadow-[0_36px_62px_-30px_rgba(5,3,17,0.65)] backdrop-blur-3xl transition-transform duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_44px_70px_-28px_rgba(5,3,17,0.7)]',
        gradient,
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -left-28 -top-32 h-64 w-64 rounded-full bg-white/30 blur-[140px]" />
        <div className="absolute -right-32 top-12 h-56 w-56 rounded-full bg-white/25 blur-[160px]" />
        <div className="absolute inset-x-[-35%] bottom-[-45%] h-80 rounded-full bg-white/15 blur-[180px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.15),_transparent_60%)]" />
      </div>
      {!hideHeader && (
        <div className="relative z-[1] flex items-center justify-between px-6 pt-6">
          <h2 className="text-lg font-semibold tracking-tight drop-shadow-[0_10px_24px_rgba(5,3,17,0.65)]">
            {title}
          </h2>
          {headerContent}
        </div>
      )}
      <div className={clsx('relative z-[1] px-6 pb-6', hideHeader ? 'pt-6' : 'pt-5')}>
        {children}
      </div>
    </div>
  )
}