import { ReactNode } from 'react'
import clsx from 'clsx'

type PageContainerProps = {
  children: ReactNode
  className?: string
  variant?: 'default' | 'compact'
}

export default function PageContainer({ children, className = '', variant = 'default' }: PageContainerProps) {
  const paddingClass =
    variant === 'compact' ? 'px-4 pb-16 pt-6 md:px-6' : 'px-4 pb-24 pt-12 md:px-8'

  return (
    <div className={clsx('relative z-10 flex w-full justify-center', paddingClass)}>
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.16),transparent_60%)]" />
        <div className="absolute inset-x-[10%] top-10 h-64 rounded-[4rem] bg-gradient-to-b from-brand-bubble/20 via-transparent to-transparent blur-[120px]" />
        <div className="absolute inset-x-[15%] bottom-6 h-72 rounded-[5rem] bg-gradient-to-t from-primary/20 via-transparent to-transparent blur-[140px]" />
      </div>
      <div className={clsx('w-full max-w-6xl space-y-8', className)}>{children}</div>
    </div>
  )
}
