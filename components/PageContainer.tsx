import { ReactNode } from 'react'
import clsx from 'clsx'

export default function PageContainer({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className="relative z-10 flex w-full justify-center px-4 pb-20 pt-10 sm:px-8 lg:px-12">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-6 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-primary/10 blur-[140px]" />
        <div className="absolute -left-32 bottom-12 h-60 w-60 rounded-full bg-secondary/10 blur-[160px]" />
        <div className="absolute -right-20 top-24 h-64 w-64 rounded-full bg-brand-lavender/10 blur-[150px]" />
      </div>
      <div className={clsx('w-full max-w-7xl space-y-8', className)}>{children}</div>
    </div>
  )
}
