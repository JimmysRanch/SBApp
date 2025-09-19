// app/clients/page.tsx
'use client';

import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

type Client = {
  id: number;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ClientsPage() {
  const [rows, setRows] = useState<Client[]>([]);
  const [q, setQ] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setErr(null);

    let query = supabase
      .from('clients')
      .select('id, full_name, email, phone, created_at')
      .order('created_at', { ascending: false })
      .limit(200);

    if (q.trim()) {
      const pat = `%${q.trim()}%`;
      query = query.or(
        `full_name.ilike.${pat},email.ilike.${pat},phone.ilike.${pat}`
      );
    }

    const { data, error } = await query;

    if (error) setErr(error.message);
    else setRows(data ?? []);

    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h1>Clients</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          placeholder="Search name, email, or phone"
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
        <div style={{ color: '#b00020', marginBottom: 12 }}>
          Failed to load clients: {err}
        </div>
      )}

      {!loading && rows.length === 0 && !err && (
        <div>No clients found.</div>
      )}

      <table width="100%" cellPadding={8} style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
            <th>ID</th>
            <th>Full name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} style={{ borderBottom: '1px solid #f3f3f3' }}>
              <td>{r.id}</td>
              <td>{r.full_name ?? '—'}</td>
              <td>{r.email ?? '—'}</td>
              <td>{r.phone ?? '—'}</td>
              <td>{new Date(r.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
