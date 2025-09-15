import clsx from 'clsx'
import { ReactNode } from 'react'

interface CardProps {
  header?: ReactNode
  footer?: ReactNode
  children: ReactNode
  className?: string
}

export default function Card({ header, footer, children, className }: CardProps) {
  return (
    <div className={clsx('card', className)}>
      {header && <div className="card-header">{header}</div>}
      <div className="card-body">{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  )
}
