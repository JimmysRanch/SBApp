'use client';

import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

type Row = {
  id: number;
  start_time: string;
  end_time: string | null;
  status: string;
  pet_name: string | null;
  service_name: string | null;
};

export default function CalendarPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const { loading: authLoading, session, permissions, displayName } = useAuth();

  const load = useCallback(async () => {
    if (!session || !permissions.canManageCalendar) return;

    setLoading(true);
    setErr(null);

    try {
      const now = new Date();
      const fromISO = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const toISO = new Date(now.getFullYear(), now.getMonth() + 1, 7).toISOString();

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id, start_time, end_time, status,
          pets ( name ),
          services ( name )
        `)
        .gte('start_time', fromISO)
        .lt('start_time', toISO)
        .in('status', ['booked', 'checked_in', 'in_progress', 'completed'])
        .order('start_time', { ascending: true });

      if (error) throw error;

      const normalized: Row[] = (data ?? []).map((d: any) => ({
        id: d.id,
        start_time: d.start_time,
        end_time: d.end_time,
        status: d.status,
        pet_name: Array.isArray(d.pets) ? d.pets[0]?.name ?? null : d.pets?.name ?? null,
        service_name: Array.isArray(d.services) ? d.services[0]?.name ?? null : d.services?.name ?? null,
      }));

      setRows(normalized);
    } catch (error: any) {
      setErr(error?.message || 'Unable to load appointments');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [permissions.canManageCalendar, session]);

  useEffect(() => {
    if (authLoading) return;
    if (!session || !permissions.canManageCalendar) {
      setRows([]);
      setLoading(false);
      return;
    }
    void load();
  }, [authLoading, load, permissions.canManageCalendar, session]);

  if (authLoading) {
    return <div className="p-6">Checking your access…</div>;
  }

  if (!session) {
    return <div className="p-6">Please log in to view the calendar.</div>;
  }

  if (!permissions.canManageCalendar) {
    return (
      <div className="space-y-3 p-6">
        <h1 className="text-2xl font-semibold">Store Calendar</h1>
        <p className="text-sm text-white/80">
          You do not currently have permission to view the calendar. Please contact an administrator if you
          believe this is a mistake.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <h1>Store Calendar</h1>
      <p className="mb-3 text-sm text-white/60">
        Signed in as <span className="font-semibold text-white">{displayName ?? session.user.email}</span>
      </p>
      <button onClick={() => void load()} disabled={loading} style={{ marginBottom: 12 }}>
        {loading ? 'Loading…' : 'Refresh'}
      </button>

      {err && <div style={{ color: '#b00020', marginBottom: 12 }}>Error: {err}</div>}
      {!loading && rows.length === 0 && !err && <div>No appointments found.</div>}

      <table width="100%" cellPadding={8} style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
            <th>Pet / Service</th>
            <th>Date</th>
            <th>Start</th>
            <th>End</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => {
            const st = new Date(a.start_time);
            const et = a.end_time ? new Date(a.end_time) : null;
            return (
              <tr key={a.id} style={{ borderBottom: '1px solid #f3f3f3' }}>
                <td>
                  <strong>{a.pet_name ?? 'Unknown pet'}</strong> — {a.service_name ?? 'Service'}
                </td>
                <td>{st.toLocaleDateString()}</td>
                <td>{st.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                <td>
                  {et
                    ? et.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '—'}
                </td>
                <td>{a.status}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
