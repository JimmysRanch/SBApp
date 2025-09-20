import { ReactNode } from 'react'
import clsx from 'clsx'

type PageContainerProps = {
  children: ReactNode
  className?: string
  variant?: 'default' | 'compact'
}

export default function PageContainer({ children, className = '', variant = 'default' }: PageContainerProps) {
  const paddingClass =
    variant === 'compact' ? 'px-4 pb-16 pt-6 md:px-6' : 'px-4 pb-24 pt-10 md:px-8'

  return (
    <div className={clsx('relative z-10 flex w-full justify-center', paddingClass)}>
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(30,123,255,0.18),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(255,102,196,0.16),transparent_62%)]" />
        <div className="absolute -left-32 top-4 h-80 w-80 rounded-full bg-primary/25 blur-[200px]" />
        <div className="absolute right-[-18rem] bottom-[-12rem] h-[32rem] w-[32rem] rounded-full bg-brand-obsidian/80 blur-[240px]" />
        <div className="absolute left-1/2 top-1/3 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-brand-mint/20 blur-[200px]" />
      </div>
      <div className={clsx('w-full max-w-6xl space-y-6', className)}>{children}</div>
    </div>
  )
}
