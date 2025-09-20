'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

type TeamMember = {
  id: number | null;
  name: string | null;
  email: string | null;
  role: string | null;
  app_permissions: Record<string, unknown> | null;
};

const configurationLinks = [
  { href: '/settings/profile', label: 'Profile' },
  { href: '/settings/business', label: 'Business' },
  { href: '/settings/services', label: 'Services' },
  { href: '/settings/notifications', label: 'Notifications' },
  { href: '/settings/billing', label: 'Billing' },
];

function hasElevatedAccess(member: TeamMember): boolean {
  const role = member.role?.toLowerCase() ?? '';
  if (role.includes('owner') || role.includes('admin') || role.includes('manager')) {
    return true;
  }

  if (member.app_permissions && typeof member.app_permissions === 'object') {
    const flags = member.app_permissions as Record<string, unknown>;
    return (
      flags.is_owner === true ||
      flags.is_manager === true ||
      flags.can_edit_schedule === true ||
      flags.can_manage_discounts === true ||
      flags.can_view_reports === true
    );
  }

  return false;
}

export default function SettingsPage() {
  const {
    loading: authLoading,
    session,
    displayName,
    email,
    role,
    isOwner,
    permissions,
    signOut,
  } = useAuth();

  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const loadTeam = useCallback(async () => {
    if (!isOwner) {
      setTeam([]);
      setErr(null);
      return;
    }

    setLoading(true);
    setErr(null);

    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id,name,email,role,app_permissions')
        .order('name');

      if (error) throw error;

      const rows = (data ?? []) as TeamMember[];
      setTeam(rows.filter(hasElevatedAccess));
    } catch (error: any) {
      setErr(error?.message || 'Unable to load team members.');
      setTeam([]);
    } finally {
      setLoading(false);
    }
  }, [isOwner]);

  useEffect(() => {
    if (!authLoading && session && isOwner) {
      void loadTeam();
    }
  }, [authLoading, isOwner, loadTeam, session]);

  const roleLabel = useMemo(() => {
    if (role) return role;
    return isOwner ? 'Owner' : 'Team Member';
  }, [isOwner, role]);

  const userEmail = session?.user?.email ?? email ?? null;

  const handleLogout = useCallback(() => {
    void signOut();
  }, [signOut]);

  if (authLoading) {
    return <div className="p-6">Loading settings…</div>;
  }

  if (!session) {
    return <div className="p-6">Please log in to view settings.</div>;
  }

  if (!permissions.canAccessSettings) {
    return (
      <div className="space-y-3 p-6">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-white/80">
          You do not currently have access to this page. Please contact an administrator if you believe this is
          an error.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div className="glass-panel max-w-3xl space-y-5 bg-[linear-gradient(150deg,rgba(8,12,28,0.94)_0%,rgba(8,36,90,0.78)_52%,rgba(5,6,18,0.92)_100%)] p-6 backdrop-saturate-150">
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-sm text-white/70">Manage your Scruffy Butts workspace.</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/50">Logged in as</p>
          <p className="text-2xl font-bold text-white">
            {displayName ?? userEmail ?? 'Team member'}
          </p>
          <p className="text-sm text-white/70">
            Role: <span className="font-semibold text-white">{roleLabel}</span>
          </p>
          {userEmail && <p className="text-xs text-white/50">Email: {userEmail}</p>}
        </div>

        <button
          onClick={handleLogout}
          className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-brand-bubble to-brand-bubbleDark px-5 py-2 text-sm font-semibold text-white shadow-[0_24px_40px_-24px_rgba(255,102,196,0.85)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_45px_-22px_rgba(255,61,158,0.9)]"
        >
          Log out
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-panel space-y-4 bg-[linear-gradient(150deg,rgba(8,12,28,0.92)_0%,rgba(8,36,90,0.75)_50%,rgba(5,6,18,0.9)_100%)] p-6 backdrop-saturate-150">
          <h2 className="text-xl font-semibold text-white">Configuration</h2>
          <ul className="list-disc space-y-1 pl-6 text-sm text-white/70">
            {configurationLinks.map((link) => (
              <li key={link.href}>
                <Link className="text-brand-bubble transition-colors hover:text-brand-bubbleDark" href={link.href}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {isOwner && (
          <div className="glass-panel space-y-4 bg-[linear-gradient(150deg,rgba(8,12,28,0.92)_0%,rgba(8,36,90,0.75)_50%,rgba(5,6,18,0.9)_100%)] p-6 backdrop-saturate-150">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Team members with elevated access</h2>
              <button
                onClick={() => void loadTeam()}
                disabled={loading}
                className="text-sm font-semibold text-brand-bubble transition-colors hover:text-brand-bubbleDark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
            {err && <p className="text-sm font-medium text-red-200">{err}</p>}
            {!err && team.length === 0 && (
              <p className="text-sm text-white/70">
                No other teammates currently have elevated access.
              </p>
            )}
            <ul className="space-y-3 text-sm text-white">
              {team.map((member) => (
                <li
                  key={member.id ?? member.email ?? Math.random()}
                  className="rounded-xl border border-white/10 bg-white/5 p-3 shadow-[0_18px_38px_-28px_rgba(5,10,35,0.75)]"
                >
                  <p className="font-semibold text-white">
                    {member.name ?? member.email ?? `Team member #${member.id ?? '—'}`}
                  </p>
                  <p className="text-xs text-white/60">
                    {member.email ?? '—'} • {member.role ?? 'Team member'}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
