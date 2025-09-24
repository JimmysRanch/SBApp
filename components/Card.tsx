import { ReactNode } from 'react'
import clsx from 'clsx'

export default function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        'glitter-card relative overflow-hidden rounded-[2rem] border border-white/30 bg-white/85 p-6 text-brand-navy shadow-soft backdrop-blur-xl',
        className
      )}
    >
      {children}
    </div>
  )
}
