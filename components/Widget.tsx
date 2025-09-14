import { ReactNode } from 'react'
import clsx from 'clsx'

interface WidgetProps {
  title: string
  color?: 'pink' | 'purple' | 'green' | 'blue'
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
    blue: 'bg-primary',
  }[color]

  const bodyColor = {
    pink: 'bg-secondary-pink/20',
    purple: 'bg-secondary-purple/20',
    green: 'bg-secondary-green/20',
    blue: 'bg-primary-light/20',
  }[color]

  return (
    <div className={clsx('flex h-full flex-col overflow-hidden rounded-3xl shadow', bodyColor, className)}>
      <div className={clsx('px-5 py-3 text-sm font-semibold text-primary-dark', headerColor)}>
        {title}
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        {children}
      </div>
    </div>
  )
}