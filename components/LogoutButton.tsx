'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function LogoutButton() {
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (mounted) setEmail(user?.email ?? null)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setEmail(s?.user?.email ?? null)
    })
    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  if (!email) return null

  return (
    <div className="space-y-2 text-sm">
      <div className="truncate">{email}</div>
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
