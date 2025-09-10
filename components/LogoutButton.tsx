'use client'

import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

export default function LogoutButton() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    let mounted = true
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (mounted) setUser(user)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  if (!user) return null

  return (
    <div>
      <p className="mb-2 text-sm text-gray-700">Logged in as {user.email}</p>
      <button
        className="w-full rounded bg-gray-800 px-3 py-2 text-white"
        onClick={async () => {
          await supabase.auth.signOut()
          window.location.href = '/login'
        }}
      >
        Log out
      </button>
    </div>
  )
}
