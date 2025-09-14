import { ReactNode } from 'react'
import clsx from 'clsx'

export default function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={clsx('rounded-3xl bg-white p-6 shadow', className)}>{children}</div>
}
