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
        <div className="absolute inset-x-[10%] top-0 h-64 rounded-full bg-white/10 blur-[140px]" />
        <div className="absolute -left-24 top-16 h-60 w-60 rounded-full bg-secondary/20 blur-[140px]" />
        <div className="absolute -right-28 bottom-20 h-[22rem] w-[22rem] rounded-full bg-primary/25 blur-[160px]" />
        <div className="absolute inset-x-[-35%] bottom-[-45%] h-[26rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(111,227,255,0.18),_transparent_70%)] blur-[200px]" />
        <div className="absolute inset-x-[-20%] bottom-[-32%] h-64 origin-bottom bg-[linear-gradient(180deg,rgba(111,227,255,0.22),rgba(5,3,17,0))] opacity-60" />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-[-22%] -z-20 h-72 origin-bottom">
        <div className="h-full w-full scale-110 bg-[radial-gradient(ellipse_at_center,_rgba(111,227,255,0.18),_transparent_70%)] opacity-80" />
      </div>
      <div className={clsx('w-full max-w-6xl space-y-8', className)}>{children}</div>
    </div>
  )
}
