import '@/app/globals.css'
import { ReactNode } from 'react'

export const metadata = {
  title: 'Scruffy Butts',
  description: 'Manage your grooming salon efficiently with Scruffy Butts.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}