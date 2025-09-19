import { ReactNode } from 'react'
import clsx from 'clsx'

export default function PageContainer({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className="relative z-10 flex w-full justify-center px-4 pb-32 pt-28 md:px-12">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="orb-floating orb-floating--left" />
        <div className="orb-floating orb-floating--right" />
        <div className="orb-floating orb-floating--bottom" />
        <div className="streamer-swish" />
        <div className="sparkle-field" />
      </div>
      <div className={clsx('w-full max-w-6xl space-y-10', className)}>{children}</div>
    </div>
  )
}
