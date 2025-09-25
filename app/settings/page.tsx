'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase/client';
import { canManageWorkspace } from '@/lib/auth/roles';

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
  const { loading: authLoading, role, profile, refresh } = useAuth();

  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const loadTeam = useCallback(async () => {
    if (!canManageWorkspace(role)) {
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
  }, [role]);

  useEffect(() => {
    if (!authLoading && canManageWorkspace(role)) {
      void loadTeam();
    }
  }, [authLoading, loadTeam, role]);

  const roleLabel = useMemo(() => role ?? 'Guest', [role]);

  const userEmail = profile?.email ?? null;

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    await refresh();
  }, [refresh]);

  if (authLoading) {
    return <div className="p-6">Loading settings…</div>;
  }

  if (!profile) {
    return <div className="p-6">Please log in to view settings.</div>;
  }

  if (!canManageWorkspace(role)) {
    return (
      <div className="space-y-3 p-6">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-white/80">
          You do not currently have access to this page. Please contact an administrator if you believe this is an error.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div className="glass-panel max-w-3xl space-y-4 bg-white/90 p-6 text-brand-navy">
        <div>
          <h1 className="text-3xl font-bold text-brand-navy">Settings</h1>
          <p className="text-sm text-brand-navy/70">Manage your Scruffy Butts workspace.</p>
        </div>

        <div className="rounded-2xl bg-white/70 p-4 shadow-inner">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-navy/60">Logged in as</p>
          <p className="text-2xl font-bold text-brand-navy">{userEmail ?? 'Team member'}</p>
          <p className="text-sm text-brand-navy/70">
            Role: <span className="font-semibold text-brand-navy">{roleLabel}</span>
          </p>
          {userEmail && <p className="text-xs text-brand-navy/50">Email: {userEmail}</p>}
        </div>

        <button
          onClick={handleLogout}
          className="inline-flex items-center justify-center rounded-full bg-brand-bubble px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-brand-bubbleDark"
        >
          Log out
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-panel space-y-3 bg-white/90 p-6 text-brand-navy">
          <h2 className="text-xl font-semibold">Configuration</h2>
          <ul className="list-disc space-y-1 pl-6 text-sm text-brand-navy/80">
            {configurationLinks.map((link) => (
              <li key={link.href}>
                <Link className="text-brand-bubble hover:text-brand-bubbleDark" href={link.href}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {canManageWorkspace(role) && (
          <div className="glass-panel space-y-4 bg-white/90 p-6 text-brand-navy">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Team members with elevated access</h2>
              <button
                onClick={() => void loadTeam()}
                disabled={loading}
                className="text-sm font-semibold text-brand-bubble transition hover:text-brand-bubbleDark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
            {err && <p className="text-sm font-medium text-red-600">{err}</p>}
            {!err && team.length === 0 && (
              <p className="text-sm text-brand-navy/70">No other teammates currently have elevated access.</p>
            )}
            <ul className="space-y-3 text-sm">
              {team.map((member) => (
                <li
                  key={member.id ?? member.email ?? Math.random()}
                  className="rounded-xl border border-brand-navy/10 bg-white/70 p-3 shadow-sm"
                >
                  <p className="font-semibold text-brand-navy">
                    {member.name ?? member.email ?? `Team member #${member.id ?? '—'}`}
                  </p>
                  <p className="text-xs text-brand-navy/60">
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
