'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function LogoutButton() {
  const [hasUser, setHasUser] = useState(false)

  useEffect(() => {
    let mounted = true
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (mounted) setHasUser(!!user)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setHasUser(!!s?.user)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  if (!hasUser) return null

  return (
    <button
      className="w-full rounded bg-gray-800 px-3 py-2 text-white"
      onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login' }}
    >
      Log out
    </button>
  )
}
