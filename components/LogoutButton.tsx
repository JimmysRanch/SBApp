'use client'

import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/components/AuthProvider'

export default function LogoutButton() {
  const { email } = useAuth()

  return (
    <div className="text-sm">
      <div className="mb-2 h-5 truncate">{email}</div>
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
