import clsx from 'clsx'
import { ReactNode } from 'react'

export type BadgeVariant = 'info' | 'success' | 'warn' | 'danger' | 'progress' | 'accent'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
}

export default function Badge({ children, variant = 'info', className }: BadgeProps) {
  const variantClass: Record<BadgeVariant, string> = {
    info: 'bg-info text-white',
    success: 'bg-success text-white',
    warn: 'bg-warn text-white',
    danger: 'bg-danger text-white',
    progress: 'bg-progress text-white',
    accent: 'bg-accent text-white'
  }

  return <span className={clsx('chip', variantClass[variant], className)}>{children}</span>
}
