'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { useAuth } from '@/components/AuthProvider';
import PageContainer from '@/components/PageContainer';
import Card from '@/components/Card';
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
    return (
      <PageContainer>
        <Card>Loading settings…</Card>
      </PageContainer>
    );
  }

  if (!session) {
    return (
      <PageContainer>
        <Card>Please log in to view settings.</Card>
      </PageContainer>
    );
  }

  if (!permissions.canAccessSettings) {
    return (
      <PageContainer>
        <Card className="space-y-3">
          <h1 className="text-2xl font-semibold text-brand-charcoal">Settings</h1>
          <p className="text-sm text-slate-500">
            You do not currently have access to this page. Please contact an administrator if you believe this is
            an error.
          </p>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-8">
        <Card className="max-w-3xl space-y-5">
          <div>
            <h1 className="text-3xl font-semibold text-brand-charcoal">Settings</h1>
            <p className="text-sm text-slate-500">Manage your Scruffy Butts workspace.</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-inner shadow-slate-200/40">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Logged in as</p>
            <p className="text-2xl font-semibold text-brand-charcoal">
              {displayName ?? userEmail ?? 'Team member'}
            </p>
            <p className="text-sm text-slate-500">
              Role: <span className="font-semibold text-brand-charcoal">{roleLabel}</span>
            </p>
            {userEmail && <p className="text-xs text-slate-400">Email: {userEmail}</p>}
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition hover:translate-y-[-2px] hover:bg-primary-dark"
          >
            Log out
          </button>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="space-y-3">
            <h2 className="text-xl font-semibold text-brand-charcoal">Configuration</h2>
            <ul className="space-y-2 text-sm text-slate-600">
              {configurationLinks.map((link) => (
                <li key={link.href}>
                  <Link className="font-semibold text-primary hover:text-primary-dark" href={link.href}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          {isOwner && (
            <Card className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-brand-charcoal">Team members with elevated access</h2>
                <button
                  onClick={() => void loadTeam()}
                  disabled={loading}
                  className="text-sm font-semibold text-primary transition hover:text-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Refreshing…' : 'Refresh'}
                </button>
              </div>
              {err && <p className="text-sm font-medium text-rose-600">{err}</p>}
              {!err && team.length === 0 && (
                <p className="text-sm text-slate-500">No other teammates currently have elevated access.</p>
              )}
              <ul className="space-y-3 text-sm">
                {team.map((member) => (
                  <li
                    key={member.id ?? member.email ?? Math.random()}
                    className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-inner shadow-slate-200/40"
                  >
                    <p className="font-semibold text-brand-charcoal">
                      {member.name ?? member.email ?? `Team member #${member.id ?? '—'}`}
                    </p>
                    <p className="text-xs text-slate-500">
                      {member.email ?? '—'} • {member.role ?? 'Team member'}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
