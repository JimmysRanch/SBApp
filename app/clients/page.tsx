'use client';

import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useEffect, useState } from 'react';

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
      .from('clients_with_pets')
      .select('id, full_name, email, phone, pet_names, created_at')
      .order('created_at', { ascending: false })
      .limit(200);

    if (q.trim()) {
      const pat = `%${q.trim()}%`;
      query = query.or(
        `full_name.ilike.${pat},email.ilike.${pat},phone.ilike.${pat},pet_names.ilike.${pat}`
      );
    }

    const { data, error } = await query;
    if (error) setErr(error.message); else setRows(data ?? []);
    setLoading(false);
  }

  // We only need the initial fetch when the page mounts.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Clients</h1>
            <p className="text-sm text-slate-500">Search clients and jump into their details in one click.</p>
          </div>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            load();
          }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <div className="relative flex-1">
            <input
              placeholder="Search name, email, phone, or pet"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pr-12 text-base text-slate-700 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m0 0A7.5 7.5 0 1 0 9 16.5a7.5 7.5 0 0 0 7.65-7.65Z" />
              </svg>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-12 items-center justify-center rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z" />
                </svg>
                Loading…
              </span>
            ) : (
              'Refresh'
            )}
          </button>
        </form>

        {err && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Failed to load clients: {err}
          </div>
        )}

        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-20 rounded-xl border border-slate-100 bg-white/60 shadow-sm backdrop-blur-sm"
              >
                <div className="h-full w-full animate-pulse rounded-xl bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100" />
              </div>
            ))
          ) : rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
              No clients found.
            </div>
          ) : (
            rows.map((r) => {
              const petLabel = r.pet_names?.trim() ? r.pet_names : 'No pets on file';
              return (
                <Link
                  key={r.id}
                  href={`/clients/${r.id}`}
                  className="group relative block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                >
                  <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-sky-500 via-blue-500 to-indigo-500 transition-all group-hover:w-2" />
                  <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-1">
                      <h2 className="text-base font-semibold text-slate-900 transition-colors group-hover:text-blue-700">
                        {r.full_name ?? 'Unnamed client'}
                      </h2>
                      <span className="inline-flex items-center gap-2 self-start rounded-full bg-gradient-to-r from-sky-100 via-blue-50 to-indigo-100 px-3 py-1 text-xs font-medium text-blue-700 shadow-sm">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          className="h-4 w-4"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733C11.285 4.876 9.623 3.75 7.688 3.75 5.099 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                          />
                        </svg>
                        {petLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
                      <span className="hidden text-xs uppercase tracking-wide sm:inline">View profile</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="h-5 w-5 transition-transform group-hover:translate-x-1"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
