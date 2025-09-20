import { ReactNode } from 'react'
import clsx from 'clsx'

type PageContainerProps = {
  children: ReactNode
  className?: string
  variant?: 'default' | 'compact'
}

export default function PageContainer({ children, className = '', variant = 'default' }: PageContainerProps) {
  const paddingClass =
    variant === 'compact' ? 'px-4 pb-16 pt-6 md:px-6' : 'px-4 pb-24 pt-10 md:px-8'

  return (
    <div className={clsx('page-frame relative z-10 flex w-full justify-center', paddingClass)}>
      <div className="page-frame__backdrop" />
      <div className="page-frame__pulse" />
      <div className={clsx('page-frame__content w-full max-w-6xl space-y-6', className)}>{children}</div>
    </div>
  )
}
