import { ReactNode } from 'react'
import clsx from 'clsx'

interface WidgetProps {
  title: string
  color?: 'accent' | 'progress' | 'success'
  children: ReactNode
  className?: string
}

export default function Widget({ title, color = 'accent', children, className }: WidgetProps) {
  const headerColor = {
    accent: 'bg-accent',
    progress: 'bg-progress',
    success: 'bg-success'
  }[color]
  return (
    <div className={clsx('card', className)}>
      <div className={clsx('card-header text-white', headerColor)}>{title}</div>
      <div className="card-body">{children}</div>
    </div>
  )
}
