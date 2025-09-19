'use client';

import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

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
  const createdFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    [],
  );

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

        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-28 rounded-2xl border border-slate-100 bg-white/60 shadow-sm backdrop-blur-sm"
              >
                <div className="h-full w-full animate-pulse rounded-2xl bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100" />
              </div>
            ))
          ) : rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
              No clients found.
            </div>
          ) : (
            rows.map((r) => {
              const created = createdFormatter.format(new Date(r.created_at));
              return (
                <Link
                  key={r.id}
                  href={`/clients/${r.id}`}
                  className="group block rounded-2xl border border-transparent bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h2 className="text-lg font-semibold text-slate-900 group-hover:text-blue-700">
                          {r.full_name ?? 'Unnamed client'}
                        </h2>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                          #{r.id}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                        <span className="flex items-center gap-2">
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
                              d="M2.25 6.75c0 8.284 6.716 15 15 15H21a.75.75 0 0 0 .75-.75v-2.708a.75.75 0 0 0-.61-.737l-3.187-.637a.75.75 0 0 0-.788.334l-.97 1.452a11.955 11.955 0 0 1-5.053-5.053l1.452-.97a.75.75 0 0 0 .334-.788l-.637-3.187a.75.75 0 0 0-.737-.61H3a.75.75 0 0 0-.75.75V6.75Z"
                            />
                          </svg>
                          {r.phone || 'No phone'}
                        </span>
                        <span className="flex items-center gap-2">
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
                              d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.32 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                            />
                          </svg>
                          {r.email || 'No email'}
                        </span>
                      </div>
                      <div className="rounded-xl bg-slate-100/70 px-3 py-2 text-sm text-slate-600">
                        <span className="font-medium text-slate-700">Pets:</span>{' '}
                        {r.pet_names ? r.pet_names : 'No pets on file'}
                      </div>
                    </div>
                    <div className="flex flex-col items-start gap-2 text-sm text-slate-400 sm:items-end">
                      <span>Created {created}</span>
                      <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-600">
                        View details
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          className="h-4 w-4 transition group-hover:translate-x-0.5"
                          aria-hidden="true"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12l-7.5 7.5m7.5-7.5H3" />
                        </svg>
                      </span>
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
