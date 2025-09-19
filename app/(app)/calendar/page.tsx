'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';

type Appointment = {
  id: number;
  start_time: string;
  end_time: string | null;
  status: string;
};

export default function CalendarPage() {
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);

    const uid = (await supabase.auth.getUser()).data.user?.id;
    if (!uid) {
      setErr('No logged-in user');
      setLoading(false);
      return;
    }

    // find employee for this user
    const { data: emp, error: empErr } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', uid)
      .single();

    if (empErr || !emp) {
      setErr(empErr?.message || 'No employee linked');
      setLoading(false);
      return;
    }

    const now = new Date();
    const fromISO = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const toISO = new Date(now.getFullYear(), now.getMonth() + 1, 7).toISOString();

    const { data, error } = await supabase
      .from('appointments')
      .select('id, start_time, end_time, status')
      .eq('employee_id', emp.id)
      .gte('start_time', fromISO)
      .lt('start_time', toISO)
      .in('status', ['booked', 'checked_in', 'in_progress', 'completed'])
      .order('start_time', { ascending: true });

    if (error) setErr(error.message);
    else setAppts((data as Appointment[]) ?? []);

    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Employee Calendar</h1>
      <button onClick={load} disabled={loading} style={{ marginBottom: 16 }}>
        {loading ? 'Loading…' : 'Refresh'}
      </button>

      {err && <div style={{ color: 'red' }}>Error: {err}</div>}
      {!loading && appts.length === 0 && !err && <p>No appointments found in this range.</p>}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #ddd' }}>
            <th style={{ textAlign: 'left', padding: 8 }}>Date</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Start</th>
            <th style={{ textAlign: 'left', padding: 8 }}>End</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {appts.map(a => {
            const st = new Date(a.start_time);
            const et = a.end_time ? new Date(a.end_time) : null;
            return (
              <tr key={a.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: 8 }}>{st.toLocaleDateString()}</td>
                <td style={{ padding: 8 }}>{st.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                <td style={{ padding: 8 }}>{et ? et.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                <td style={{ padding: 8 }}>{a.status}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
