import { ReactNode } from 'react'
import clsx from 'clsx'

export default function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        'rounded-[2rem] border border-white/15 bg-[linear-gradient(140deg,rgba(16,24,47,0.92),rgba(28,40,66,0.72))] p-6 text-brand-navy shadow-soft backdrop-blur-2xl',
        className
      )}
    >
      {children}
    </div>
  )
}
