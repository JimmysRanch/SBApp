'use client'

import { useAuth } from '@/components/AuthProvider'

export default function LogoutButton() {
  const { loading, displayName, email, role, signOut } = useAuth()

  if (loading) return null

  const label = displayName ?? email ?? 'Signed in'

  return (
    <div className="text-sm text-slate-600">
      <div className="mb-1 truncate text-sm font-semibold text-brand-charcoal">{label}</div>
      {role && (
        <div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-slate-500">{role}</div>
      )}
      <button
        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 font-semibold text-brand-charcoal transition hover:border-primary hover:text-primary"
        onClick={() => {
          void signOut()
        }}
      >
        Log out
      </button>
    </div>
  )
}
