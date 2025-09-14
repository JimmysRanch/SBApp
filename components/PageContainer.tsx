import { ReactNode } from 'react'
import TopNav from './TopNav'
import clsx from 'clsx'

export default function PageContainer({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className="flex h-screen flex-col bg-gray-100">
      <TopNav />
      <main className={clsx('mx-auto flex-1 overflow-auto max-w-7xl p-6 space-y-6 flex flex-col', className)}>
        {children}
      </main>
    </div>
  )
}
