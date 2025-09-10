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
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setUser(s?.user ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  if (!user) return null

  const name =
    (user.user_metadata?.name as string | undefined) ||
    (user.user_metadata?.full_name as string | undefined) ||
    user.email

  return (
    <div>
      <p className="mb-2 text-sm text-gray-600">Logged in as {name}</p>
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
