'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { useAuth } from '@/components/AuthProvider';
import Card from '@/components/Card';
import PageContainer from '@/components/PageContainer';
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
        <Card>
          <p className="text-sm text-slate-300">Loading settings…</p>
        </Card>
      </PageContainer>
    );
  }

  if (!session) {
    return (
      <PageContainer>
        <Card>
          <p className="text-sm text-slate-300">Please log in to view settings.</p>
        </Card>
      </PageContainer>
    );
  }

  if (!permissions.canAccessSettings) {
    return (
      <PageContainer>
        <Card>
          <h1 className="text-2xl font-semibold text-brand-cream">Settings</h1>
          <p className="text-sm text-slate-400">
            You do not currently have access to this page. Please contact an administrator if you believe this is
            an error.
          </p>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="space-y-10">
      <Card>
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-brand-cream">Settings</h1>
            <p className="text-sm text-slate-400">Tune the Scruffy Butts workspace for your crew.</p>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/60 p-5 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.9)]">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">Logged in as</p>
            <p className="mt-2 text-2xl font-bold text-brand-cream">
              {displayName ?? userEmail ?? 'Team member'}
            </p>
            <p className="text-sm text-slate-400">
              Role: <span className="font-semibold text-brand-cream">{roleLabel}</span>
            </p>
            {userEmail && <p className="text-xs text-slate-500">Email: {userEmail}</p>}
          </div>

          <button
            onClick={handleLogout}
            className="group inline-flex items-center gap-2 rounded-full border border-brand-bubble/60 bg-brand-bubble/20 px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-brand-cream transition hover:-translate-y-1 hover:border-brand-bubble hover:bg-brand-bubble/30"
          >
            <span>Log out</span>
            <span className="text-base">→</span>
          </button>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-brand-cream">Configuration</h2>
            <ul className="space-y-2 text-sm text-slate-400">
              {configurationLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    className="inline-flex items-center gap-2 rounded-full border border-transparent px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-brand-cream transition hover:border-brand-bubble/60 hover:text-brand-cream"
                    href={link.href}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-bubble" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        {isOwner && (
          <Card>
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-semibold text-brand-cream">Team members with elevated access</h2>
                <button
                  onClick={() => void loadTeam()}
                  disabled={loading}
                  className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400 transition hover:text-brand-cream disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Refreshing…' : 'Refresh'}
                </button>
              </div>
              {err && <p className="text-sm font-medium text-rose-300">{err}</p>}
              {!err && team.length === 0 && (
                <p className="text-sm text-slate-400">No other teammates currently have elevated access.</p>
              )}
              <ul className="space-y-3 text-sm">
                {team.map((member) => (
                  <li
                    key={member.id ?? member.email ?? Math.random()}
                    className="rounded-[1.25rem] border border-white/10 bg-slate-950/60 px-4 py-3 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.9)]"
                  >
                    <p className="font-semibold text-brand-cream">
                      {member.name ?? member.email ?? `Team member #${member.id ?? '—'}`}
                    </p>
                    <p className="text-xs text-slate-400">
                      {member.email ?? '—'} • {member.role ?? 'Team member'}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
