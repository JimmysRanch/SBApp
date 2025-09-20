import { ReactNode } from 'react'
import clsx from 'clsx'

export default function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        'rounded-[2rem] border border-white/10 bg-brand-onyx/70 p-6 text-brand-cream shadow-soft backdrop-blur-2xl',
        className
      )}
    >
      {children}
    </div>
  )
}
