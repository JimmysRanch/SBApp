// app/employees/history/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

type Row = {
  id: number;
  start_time: string;
  status: string | null;
  price: number | null;
  clients: { full_name: string | null } | null;
  pets: { name: string | null } | null;
  services: { name: string | null } | null;
};

export default function EmployeeHistoryPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  async function load() {
    setLoading(true);
    setErr(null);

    const uid = (await supabase.auth.getUser()).data.user?.id;
    if (!uid) {
      setErr('No logged-in user');
      setLoading(false);
      return;
    }

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

    // Force 1:1 related objects using FK labels.
    // Default FK names from Postgres: appointments_*_fkey
    let query = supabase
      .from('appointments')
      .select(
        [
          'id',
          'start_time',
          'status',
          'price',
          'clients:clients!appointments_client_id_fkey(full_name)',
          'pets:pets!appointments_pet_id_fkey(name)',
          'services:services!appointments_service_id_fkey(name)',
        ].join(',')
      )
      .eq('employee_id', emp.id)
      .order('start_time', { ascending: false })
      .limit(200);

    if (q.trim()) {
      const pat = `%${q.trim()}%`;
      // filter on leaf fields only
      query = query.or(
        `status.ilike.${pat},price::text.ilike.${pat}`
      );
    }

    const res = (await query) as unknown as { data: Row[] | null; error: any };
    if (res.error) setErr(res.error.message);
    else setRows(res.data ?? []);

    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h1>Appointment History</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          placeholder="Search status or price"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
          style={{ flex: 1, padding: 8 }}
        />
        <button onClick={load} disabled={loading} style={{ padding: '8px 12px' }}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {err && (
        <div style={{ color: '#b00020', marginBottom: 12 }}>Error: {err}</div>
      )}

      {!loading && rows.length === 0 && !err && <div>No appointments found.</div>}

      <table width="100%" cellPadding={8} style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
            <th>Date</th>
            <th>Client</th>
            <th>Pet</th>
            <th>Service</th>
            <th>Status</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} style={{ borderBottom: '1px solid #f3f3f3' }}>
              <td>{new Date(r.start_time).toLocaleString()}</td>
              <td>{r.clients?.full_name ?? '—'}</td>
              <td>{r.pets?.name ?? '—'}</td>
              <td>{r.services?.name ?? '—'}</td>
              <td>{r.status ?? '—'}</td>
              <td>{Number(r.price ?? 0).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
