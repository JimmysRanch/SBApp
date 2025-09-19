'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';

type Row = {
  id: number;
  start_time: string;
  end_time: string | null;
  status: string;
  pets: { name: string } | null;
  services: { name: string } | null;
};

export default function CalendarPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);

    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) {
      setErr('No logged-in user');
      setLoading(false);
      return;
    }

    const uid = sess.session.user.id;

    const { data: emp, error: empErr } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', uid)
      .single();
    if (empErr || !emp) {
      setErr(empErr?.message || 'Employee not found');
      setLoading(false);
      return;
    }

    const now = new Date();
    const fromISO = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const toISO   = new Date(now.getFullYear(), now.getMonth() + 1, 7).toISOString();

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id, start_time, end_time, status,
        pets ( name ),
        services ( name )
      `)
      .eq('employee_id', emp.id)
      .gte('start_time', fromISO)
      .lt('start_time', toISO)
      .in('status', ['booked','checked_in','in_progress','completed'])
      .order('start_time', { ascending: true });

    if (error) setErr(error.message);
    else setRows((data as Row[]) ?? []);

    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div style={{ padding: 16 }}>
      <h1>Employee Calendar</h1>
      <button onClick={load} disabled={loading} style={{ marginBottom: 12 }}>
        {loading ? 'Loading…' : 'Refresh'}
      </button>

      {err && <div style={{ color: '#b00020' }}>Error: {err}</div>}
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
          {rows.map(a => {
            const st = new Date(a.start_time);
            const et = a.end_time ? new Date(a.end_time) : null;
            return (
              <tr key={a.id} style={{ borderBottom: '1px solid #f3f3f3' }}>
                <td><strong>{a.pets?.name ?? 'Unknown pet'}</strong> — {a.services?.name ?? 'Service'}</td>
                <td>{st.toLocaleDateString()}</td>
                <td>{st.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                <td>{et ? et.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                <td>{a.status}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
