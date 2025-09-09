// components/AuthProvider.tsx
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      router.refresh()
    })
    return () => sub?.subscription?.unsubscribe()
  }, [router])
  return <>{children}</>
}

// app/layout.tsx
import AuthProvider from '@/components/AuthProvider'
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
