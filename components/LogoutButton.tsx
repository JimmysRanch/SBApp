'use client'

import { useAuth } from '@/components/AuthProvider'

export default function LogoutButton() {
  const { loading, displayName, email, role, signOut } = useAuth()

  if (loading) return null

  const label = displayName ?? email ?? 'Signed in'

  return (
    <div className="text-sm text-brand-navy/80">
      <div className="mb-1 truncate text-sm font-semibold text-brand-navy">{label}</div>
      {role && (
        <div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-brand-navy/60">{role}</div>
      )}
      <button
        className="w-full rounded-full bg-[linear-gradient(130deg,rgba(56,242,255,0.24),rgba(139,92,246,0.18))] px-3 py-2 font-medium text-brand-navy shadow-[0_16px_32px_-20px_rgba(56,242,255,0.5)] transition hover:bg-[linear-gradient(130deg,rgba(56,242,255,0.34),rgba(139,92,246,0.26))]"
        onClick={() => {
          void signOut()
        }}
      >
        Log out
      </button>
    </div>
  )
}
