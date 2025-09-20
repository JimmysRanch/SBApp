'use client'

import { useAuth } from '@/components/AuthProvider'

export default function LogoutButton() {
  const { loading, signOut } = useAuth()

  if (loading) return null

  return (
    <button
      type="button"
      className="rounded-full bg-white/20 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/30"
      onClick={() => {
        void signOut()
      }}
    >
      Log out
    </button>
  )
}
