'use client'

import { useAuth } from '@/components/AuthProvider'

export default function LogoutButton() {
  const { loading, displayName, email, role, signOut } = useAuth()

  if (loading) return null

  const label = displayName ?? email ?? 'Signed in'

  return (
    <div className="text-sm text-brand-cream/80">
      <div className="mb-1 truncate text-sm font-semibold text-brand-cream">{label}</div>
      {role && (
        <div className="mb-2 text-[11px] uppercase tracking-[0.25em] text-brand-cream/60">{role}</div>
      )}
      <button
        className="w-full rounded-full bg-gradient-to-r from-brand-bubble via-secondary.purple to-primary.light px-3 py-2 font-medium text-white shadow-[0_18px_45px_-25px_rgba(255,10,120,0.6)] transition-transform hover:-translate-y-0.5"
        onClick={() => {
          void signOut()
        }}
      >
        Log out
      </button>
    </div>
  )
}
