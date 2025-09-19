import { ReactNode } from 'react'
import clsx from 'clsx'

interface CardProps {
  children: ReactNode
  className?: string
  outerClassName?: string
}

export default function Card({ children, className = '', outerClassName = '' }: CardProps) {
  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-[2.6rem] p-[1px] shadow-[0_28px_65px_-40px_rgba(6,13,32,0.85)]',
        outerClassName
      )}
    >
      <div className="absolute inset-0 rounded-[2.6rem] bg-gradient-to-br from-white/25 via-white/10 to-transparent opacity-70" />
      <div
        className={clsx(
          'relative z-10 h-full rounded-[2.45rem] bg-brand-cream/95 p-8 text-brand-navy shadow-[0_20px_45px_-35px_rgba(12,20,48,0.55)]',
          className
        )}
      >
        {children}
      </div>
      <div className="pointer-events-none absolute -left-10 top-12 h-40 w-40 rounded-full bg-white/40 blur-[140px] opacity-20" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-48 w-48 rounded-full bg-brand-blue/20 blur-[160px] opacity-10" />
    </div>
  )
}
