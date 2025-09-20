import { ReactNode } from 'react'
import clsx from 'clsx'

export default function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-gradient-to-br from-slate-950/75 via-slate-900/40 to-slate-950/80 p-8 text-brand-navy shadow-[0_35px_80px_-40px_rgba(15,23,42,0.9)] backdrop-blur-2xl',
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),transparent_65%)] opacity-70" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(124,58,237,0.16),transparent_65%)] opacity-60" />
      <div className="relative z-10 space-y-4">{children}</div>
    </div>
  )
}
