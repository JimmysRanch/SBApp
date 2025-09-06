import { ReactNode } from 'react'
import clsx from 'clsx'

interface WidgetProps {
  title: string
  color?: 'pink' | 'purple' | 'green'
  children: ReactNode
}

// A simple card with a thin colored header matching the supplied color. See the
// dashboard mockups for examples of how these widgets should look.
export default function Widget({ title, color = 'pink', children }: WidgetProps) {
  const headerColor = {
    pink: 'bg-secondary-pink',
    purple: 'bg-secondary-purple',
    green: 'bg-secondary-green',
  }[color]
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className={clsx('text-sm font-semibold px-4 py-2', headerColor)}>
        {title}
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  )
}