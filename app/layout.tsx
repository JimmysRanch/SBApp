import SiteHeader from '@/components/layout/SiteHeader'
import './globals.css'
import AuthProvider from '@/components/AuthProvider'

export const metadata = {
  title: 'Scruffy Butts',
  description: 'Grooming dashboard'
}
export const runtime = 'nodejs'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        <main>
          <AuthProvider>{children}</AuthProvider>
        </main>
      </body>
    </html>
  )
}
