import { ReactNode } from 'react'
import clsx from 'clsx'

export default function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        'rounded-5xl border border-border-strong bg-surface-frosted p-space-lg text-brand-navy shadow-elevation-md backdrop-blur-xl',
        className
      )}
    >
      {children}
    </div>
  )
}
