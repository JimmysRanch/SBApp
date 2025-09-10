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
