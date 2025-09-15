import { ReactNode } from 'react'
import clsx from 'clsx'

export default function PageContainer({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className="relative z-10 flex w-full justify-center px-4 pb-24 pt-10 md:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-0 top-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-brand-bubble/10 blur-[160px]" />
      </div>
      <div className={clsx('w-full max-w-6xl space-y-6', className)}>{children}</div>
    </div>
  )
}
