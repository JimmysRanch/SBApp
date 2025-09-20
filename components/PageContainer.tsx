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
        <div className="absolute left-[-10%] top-0 h-72 w-72 rounded-full bg-brand-bubble/20 blur-[140px]" />
        <div className="absolute right-[-12%] top-20 h-[26rem] w-[26rem] rounded-full bg-primary/20 blur-[180px]" />
        <div className="absolute bottom-[-16%] left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-brand-blue/30 blur-[200px]" />
      </div>
      <div className={clsx('w-full max-w-6xl space-y-6', className)}>{children}</div>
    </div>
  )
}
