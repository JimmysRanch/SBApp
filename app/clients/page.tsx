'use client';

import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import PageContainer from '@/components/PageContainer';
import Card from '@/components/Card';

type Client = {
  id: number;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  pet_names: string | null;
  created_at: string;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
      .from('clients_with_pets')
      .select('id, full_name, email, phone, pet_names, created_at')
      .order('created_at', { ascending: false })
      .limit(200);

    if (q.trim()) {
      const pat = `%${q.trim()}%`;
      query = query.or(
        `full_name.ilike.${pat},email.ilike.${pat},phone.ilike.${pat},pet_names.ilike.${pat}`,
      );
    }

    const { data, error } = await query;
    if (error) setErr(error.message);
    else setRows(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tableBody = useMemo(() => {
    if (loading) {
      return (
        <tr>
          <td colSpan={6} className="py-10 text-center text-sm text-slate-500">
            Loading clients…
          </td>
        </tr>
      );
    }

    if (rows.length === 0) {
      return (
        <tr>
          <td colSpan={6} className="py-10 text-center text-sm text-slate-500">
            {err ? 'Unable to load clients.' : 'No clients match your search.'}
          </td>
        </tr>
      );
    }

    return rows.map((r) => (
      <tr
        key={r.id}
        className="border-b border-slate-100 text-sm text-slate-600 last:border-0 hover:bg-slate-50"
      >
        <td className="py-4 font-medium text-brand-charcoal">{r.id}</td>
        <td className="py-4">
          <Link className="font-semibold text-primary hover:text-primary-dark" href={`/clients/${r.id}`}>
            {r.full_name ?? '—'}
          </Link>
        </td>
        <td className="py-4">{r.email ?? '—'}</td>
        <td className="py-4">{r.phone ?? '—'}</td>
        <td className="py-4 text-slate-500">{r.pet_names || '—'}</td>
        <td className="py-4 text-slate-500">{new Date(r.created_at).toLocaleString()}</td>
      </tr>
    ));
  }, [err, loading, rows]);

  return (
    <PageContainer>
      <Card className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Directory</p>
            <h1 className="text-3xl font-semibold text-brand-charcoal">Clients</h1>
            <p className="text-sm text-slate-500">
              Search, filter, and jump straight into any client profile with a single click.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm shadow-slate-200/50 sm:w-80">
            <label htmlFor="client-search" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Search clients
            </label>
            <div className="flex items-center gap-2">
              <input
                id="client-search"
                className="w-full"
                placeholder="Name, email, phone, or pet"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void load();
                }}
              />
              <button
                type="button"
                onClick={() => void load()}
                disabled={loading}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-brand-charcoal transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Loading…' : 'Refresh'}
              </button>
            </div>
            {err && <p className="text-xs font-semibold text-rose-600">{err}</p>}
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <div className="relative max-h-[28rem] overflow-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                <tr>
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Full name</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">Pets</th>
                  <th className="px-5 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 px-5">{tableBody}</tbody>
            </table>
          </div>
        </div>
      </Card>
    </PageContainer>
  );
}
