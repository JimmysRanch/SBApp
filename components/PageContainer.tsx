import { ReactNode } from 'react'
import Sidebar from './Sidebar'
import clsx from 'clsx'

export default function PageContainer({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-secondary-pink via-secondary-purple to-secondary-green">
      <Sidebar />
      <main className={clsx('flex-1 p-6 md:p-10 space-y-6', className)}>{children}</main>
    </div>
  )
}
