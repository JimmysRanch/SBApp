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
    <div className={clsx('relative z-10 flex w-full justify-center', paddingClass)}>
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-0 top-10 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_left,_rgba(76,201,240,0.2),_transparent_60%)] blur-[180px]" />
        <div className="absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle_at_bottom_right,_rgba(139,92,246,0.18),_transparent_65%)] blur-[200px]" />
      </div>
      <div className={clsx('w-full max-w-6xl space-y-6', className)}>{children}</div>
    </div>
  )
}
