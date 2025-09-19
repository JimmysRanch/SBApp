'use client'

import { useAuth } from '@/components/AuthProvider'

export default function LogoutButton() {
  const { loading, displayName, email, role, signOut } = useAuth()

  if (loading) return null

  const label = displayName ?? email ?? 'Signed in'

  return (
    <div className="text-sm text-white/90">
      <div className="mb-1 truncate text-sm font-semibold text-white">{label}</div>
      {role && (
        <div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-white/70">{role}</div>
      )}
      <button
        className="w-full rounded-full bg-white/20 px-3 py-2 font-medium text-white transition hover:bg-white/30"
        onClick={() => {
          void signOut()
        }}
      >
        Log out
      </button>
    </div>
  )
}
