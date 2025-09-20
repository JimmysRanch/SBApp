'use client';

import Card from '@/components/Card';
import PageContainer from '@/components/PageContainer';
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
    <PageContainer className="space-y-10">
      <Card className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/clients/new"
            className="group inline-flex items-center gap-3 rounded-full border border-brand-bubble/50 bg-brand-bubble/15 px-5 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-brand-cream shadow-[0_24px_55px_-35px_rgba(34,211,238,0.6)] transition hover:-translate-y-1 hover:border-brand-bubble hover:bg-brand-bubble/25"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-bubble text-base text-brand-cream shadow-[0_12px_30px_-20px_rgba(34,211,238,0.7)]">+</span>
            Add new client
          </Link>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              load();
            }}
            className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end"
          >
            <div className="relative w-full sm:w-80">
              <input
                placeholder="Search name, email, phone, or pet"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="h-12 w-full"
              />
              <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-500">
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
            <button type="submit" className="sr-only">
              Search
            </button>
          </form>
        </div>

        {err && (
          <div className="relative overflow-hidden rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200 shadow-[0_18px_32px_-24px_rgba(248,113,113,0.6)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,_rgba(248,113,113,0.18),transparent_60%)]" />
            <p className="relative font-medium">Failed to load clients: {err}</p>
          </div>
        )}

        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/50 p-5 shadow-[0_24px_55px_-35px_rgba(15,23,42,0.9)] backdrop-blur"
              >
                <div className="h-5 w-1/3 animate-pulse rounded-full bg-brand-bubble/20" />
                <div className="mt-3 h-4 w-1/2 animate-pulse rounded-full bg-brand-bubble/10" />
              </div>
            ))
          ) : rows.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed border-white/15 bg-slate-950/40 px-6 py-12 text-center text-sm text-slate-400 backdrop-blur">
              No clients found.
            </div>
          ) : (
            rows.map((r) => {
              const petLabel = r.pet_names?.trim() ? r.pet_names : 'No pets on file';
              return (
                <Link
                  key={r.id}
                  href={`/clients/${r.id}`}
                  className="group relative block overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/60 px-5 py-5 shadow-[0_28px_60px_-40px_rgba(15,23,42,0.9)] transition duration-200 hover:-translate-y-1 hover:border-brand-bubble/60 hover:bg-slate-900/60"
                >
                  <span className="pointer-events-none absolute inset-y-4 left-4 w-1 rounded-full bg-gradient-to-b from-brand-bubble via-primary to-brand-bubble/50 opacity-80 transition-all duration-300 group-hover:inset-y-2 group-hover:w-1.5" />
                  <div className="relative flex flex-col gap-4 pl-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-2">
                      <h2 className="text-lg font-semibold text-brand-cream transition-colors duration-200 group-hover:text-white">
                        {r.full_name ?? 'Unnamed client'}
                      </h2>
                      <span className="inline-flex items-center gap-2 self-start rounded-full border border-brand-bubble/40 bg-brand-bubble/15 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-brand-cream">
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
                    <div className="flex items-center gap-2 text-sm font-semibold text-brand-cream/80">
                      <span className="hidden text-[0.65rem] uppercase tracking-[0.35em] text-slate-400 transition-colors group-hover:text-brand-cream sm:inline">
                        View profile
                      </span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="h-5 w-5 text-brand-cream transition-transform duration-200 group-hover:translate-x-1"
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
      </Card>
    </PageContainer>
  );
}
