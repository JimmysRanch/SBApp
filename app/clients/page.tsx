import Link from 'next/link';

import Card from '@/components/Card';
import PageContainer from '@/components/PageContainer';
import { createClient } from '@/lib/supabase/server';

type Client = {
  id: number;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  pet_names: string | null;
  created_at: string;
};

export const dynamic = 'force-dynamic';

type ClientsPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const supabase = createClient();
  const rawQuery = searchParams?.q;
  const query = Array.isArray(rawQuery) ? rawQuery[0] ?? '' : rawQuery ?? '';
  const trimmedQuery = query.trim();

  let request = supabase
    .from('clients_with_pets')
    .select('id, full_name, email, phone, pet_names, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  if (trimmedQuery) {
    const pattern = `%${trimmedQuery}%`;
    request = request.or(
      `full_name.ilike.${pattern},email.ilike.${pattern},phone.ilike.${pattern},pet_names.ilike.${pattern}`
    );
  }

  const { data, error } = await request;
  const rows = (data ?? []) as Client[];
  const err = error?.message ?? null;

  return (
    <PageContainer className="space-y-8">
      <Card className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/clients/new"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/40 bg-white/90 px-5 py-3 text-sm font-semibold text-primary shadow-soft transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-brand-bubble/40"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M10 3a.75.75 0 0 1 .75.75V9.25h5.5a.75.75 0 0 1 0 1.5h-5.5v5.5a.75.75 0 0 1-1.5 0v-5.5H3.25a.75.75 0 0 1 0-1.5h5.5V3.75A.75.75 0 0 1 10 3Z" />
              </svg>
              New Client
            </Link>
            <Link
              href="/booking"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:border-white/30 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-brand-bubble/40"
            >
              Book Appointment
            </Link>
          </div>
          <form method="get" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <div className="relative w-full sm:w-72">
              <input
                placeholder="Search name, email, phone, or pet"
                name="q"
                defaultValue={query}
                className="h-12 w-full rounded-xl border border-white/50 bg-white/90 px-4 pr-12 text-base text-brand-navy shadow-inner transition focus:border-brand-bubble focus:outline-none focus:ring-2 focus:ring-brand-bubble/30"
              />
              <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-brand-navy/40">
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
          <div className="rounded-2xl border border-red-300/40 bg-red-100/40 px-4 py-3 text-sm text-red-700">
            Failed to load clients: {err}
          </div>
        )}

        {!err && (
          <div className="space-y-4">
            {rows.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-brand-bubble/40 bg-white/70 px-6 py-12 text-center text-sm text-brand-navy/70">
                No clients found.
              </div>
            ) : (
              rows.map((r) => {
                const petLabel = r.pet_names?.trim() ? r.pet_names : 'No pets on file';
                return (
                  <article
                    key={r.id}
                    className="group relative overflow-hidden rounded-2xl border border-brand-bubble/40 bg-gradient-to-r from-white/95 via-white/90 to-brand-bubble/10 px-5 py-4 shadow-soft transition duration-200 hover:-translate-y-0.5 hover:shadow-xl"
                  >
                    <span className="pointer-events-none absolute inset-y-3 left-3 w-1 rounded-full bg-gradient-to-b from-brand-bubble via-brand-bubble/80 to-brand-lavender opacity-80 transition-all duration-200 group-hover:inset-y-2 group-hover:w-1.5" />
                    <div className="relative flex flex-col gap-3 pl-6 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-col gap-1">
                        <h2 className="text-base font-semibold text-brand-navy transition-colors group-hover:text-primary-dark">
                          {r.full_name ?? 'Unnamed client'}
                        </h2>
                        <span className="inline-flex items-center gap-2 self-start rounded-full bg-brand-bubble/15 px-3 py-1 text-xs font-medium text-brand-bubble">
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
                      <div className="flex flex-col gap-2 text-sm font-semibold text-primary sm:flex-row sm:items-center sm:gap-3">
                        <Link
                          href={`/clients/${r.id}`}
                          className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs uppercase tracking-wide text-primary transition hover:border-primary/40 hover:bg-primary/20"
                        >
                          View profile
                        </Link>
                        <Link
                          href={`/booking?clientId=${r.id}`}
                          className="inline-flex items-center gap-2 rounded-full border border-brand-bubble/40 bg-brand-bubble px-4 py-2 text-xs uppercase tracking-wide text-white transition hover:brightness-110"
                        >
                          Add appointment
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        )}
      </Card>
    </PageContainer>
  );
}
