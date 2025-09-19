import { ReactNode } from 'react'
import clsx from 'clsx'

export default function PageContainer({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className="relative z-10 flex w-full justify-center px-6 pb-24 pt-16 md:px-10">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-brand-blue/10 blur-[220px]" />
        <div className="absolute -left-24 bottom-[-10rem] h-[26rem] w-[26rem] rounded-full bg-brand-mint/10 blur-[200px]" />
        <div className="absolute -right-16 top-20 h-64 w-64 rounded-full bg-brand-bubble/15 blur-[180px]" />
      </div>
      <div className={clsx('w-full max-w-6xl space-y-10', className)}>{children}</div>
    </div>
  )
}
