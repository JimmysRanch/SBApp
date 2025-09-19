import { ReactNode } from 'react'
import clsx from 'clsx'

export default function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        'rounded-3xl border border-slate-200 bg-white/95 p-6 text-brand-charcoal shadow-xl shadow-slate-200/60 backdrop-blur',
        className
      )}
    >
      {children}
    </div>
  )
}
