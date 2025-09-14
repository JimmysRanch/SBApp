import { ReactNode } from 'react'
import TopNav from './TopNav'
import clsx from 'clsx'

export default function PageContainer({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <TopNav />
      <main className={clsx('mx-auto max-w-7xl p-6 space-y-6', className)}>{children}</main>
    </div>
  )
}
