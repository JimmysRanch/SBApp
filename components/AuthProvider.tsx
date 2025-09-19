// components/AuthProvider.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Session } from '@supabase/supabase-js'

import { supabase } from '@/lib/supabase/client'

type AuthContextValue = {
  email: string | null
  isManager: boolean
  claims: Record<string, unknown>
}

const defaultAuthState: AuthContextValue = {
  email: null,
  isManager: false,
  claims: {},
}

const STORAGE_KEY = 'sb-auth-state'

const AuthContext = createContext<AuthContextValue>(defaultAuthState)

export function useAuth() {
  return useContext(AuthContext)
}

const TRUTHY_STRINGS = ['true', '1', 'yes', 'y', 'on', 't']

const coerceBoolean = (value: unknown) => {
  if (value === true) return true
  if (value === false || value == null) return false
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') return TRUTHY_STRINGS.includes(value.trim().toLowerCase())
  return false
}

const parseStoredState = (): AuthContextValue => {
  if (typeof window === 'undefined') return defaultAuthState
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return defaultAuthState
  try {
    const parsed = JSON.parse(raw) as Partial<AuthContextValue>
    return {
      email: parsed.email ?? null,
      isManager: coerceBoolean(parsed.isManager),
      claims: parsed.claims && typeof parsed.claims === 'object' ? (parsed.claims as Record<string, unknown>) : {},
    }
  } catch (err) {
    console.warn('Failed to parse stored auth state', err)
    return defaultAuthState
  }
}

const claimsFromSession = (session: Session | null) => {
  if (!session?.user) return {}
  return {
    ...(session.user.app_metadata ?? {}),
    ...(session.user.user_metadata ?? {}),
  } as Record<string, unknown>
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [authState, setAuthState] = useState<AuthContextValue>(() => parseStoredState())

  useEffect(() => {
    const applySession = (session: Session | null) => {
      const nextClaims = claimsFromSession(session)
      const nextState: AuthContextValue = {
        email: session?.user?.email ?? null,
        claims: nextClaims,
        isManager: coerceBoolean(
          nextClaims?.is_manager ?? session?.user?.app_metadata?.is_manager ?? session?.user?.user_metadata?.is_manager,
        ),
      }
      setAuthState((prev) => {
        const sameEmail = prev.email === nextState.email
        const sameManager = prev.isManager === nextState.isManager
        const sameClaims = Object.keys({ ...prev.claims, ...nextState.claims }).every(
          (key) => prev.claims[key] === nextState.claims[key],
        )
        if (sameEmail && sameManager && sameClaims) {
          return prev
        }
        if (typeof window !== 'undefined') {
          if (nextState.email) {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState))
          } else {
            window.localStorage.removeItem(STORAGE_KEY)
          }
        }
        return nextState
      })
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      applySession(session)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session)
      router.refresh()
    })
    return () => sub.subscription.unsubscribe()
  }, [router])

  return <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>
}
