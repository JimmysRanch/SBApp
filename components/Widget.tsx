import { ReactNode } from 'react'
import clsx from 'clsx'

interface WidgetProps {
  title: string
  color?: 'pink' | 'purple' | 'green'
  children: ReactNode
  className?: string
}

// A simple card with a thin colored header matching the supplied color. See the
// dashboard mockups for examples of how these widgets should look.
export default function Widget({ title, color = 'pink', children, className }: WidgetProps) {
  const headerColor = {
    pink: 'bg-secondary-pink',
    purple: 'bg-secondary-purple',
    green: 'bg-secondary-green',
  }[color]
  return (
    <div className={clsx('overflow-hidden rounded-3xl bg-white shadow', className)}>
      <div className={clsx('px-5 py-3 text-sm font-semibold text-primary-dark', headerColor)}>
        {title}
      </div>
      <div className="p-5 text-primary-dark">
        {children}
      </div>
    </div>
  )
}