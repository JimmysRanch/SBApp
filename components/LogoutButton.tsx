'use client'

import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase/client'

export default function LogoutButton() {
  const { loading, refresh } = useAuth()

  if (loading) return null

  return (
    <button
      type="button"
      className="rounded-full bg-white/20 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/30"
      onClick={async () => {
        await supabase.auth.signOut()
        await refresh()
      }}
    >
      Log out
    </button>
  )
}
