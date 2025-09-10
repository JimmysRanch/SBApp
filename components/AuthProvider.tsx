// components/AuthProvider.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

type AuthContextValue = {
  email: string | null
}

const AuthContext = createContext<AuthContextValue>({ email: null })

export function useAuth() {
  return useContext(AuthContext)
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem('sb-email')
    }
    return null
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const newEmail = session?.user?.email ?? null
      setEmail(newEmail)
      if (newEmail) {
        window.localStorage.setItem('sb-email', newEmail)
      } else {
        window.localStorage.removeItem('sb-email')
      }
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const newEmail = session?.user?.email ?? null
      setEmail(newEmail)
      if (newEmail) {
        window.localStorage.setItem('sb-email', newEmail)
      } else {
        window.localStorage.removeItem('sb-email')
      }
      router.refresh()
    })
    return () => sub.subscription.unsubscribe()
  }, [router])

  return <AuthContext.Provider value={{ email }}>{children}</AuthContext.Provider>
}
