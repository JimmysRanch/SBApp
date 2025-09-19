// app/clients/[id]/page.tsx
'use client';

import Card from '@/components/Card';
import PageContainer from '@/components/PageContainer';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

type Client = {
  id: number;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
};

type Pet = {
  id: number;
  name: string | null;
  breed: string | null;
};

type Appointment = {
  id: number;
  start_time: string;
  end_time: string | null;
  status: string | null;
  price: number | null;
  service_id: number | null;
  service: string | null;
};

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
});

function getInitials(name: string | null) {
  if (!name) return 'SB';
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 0) return 'SB';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatDate(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return dateFormatter.format(date);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return `${dateFormatter.format(date)} · ${timeFormatter.format(date)}`;
}

function formatCurrency(value: number | null | undefined) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return currencyFormatter.format(value);
}

export default function ClientDetailPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const id = Number(idParam);
  const router = useRouter();

  const [client, setClient] = useState<Client | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!Number.isFinite(id)) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      const [clientResult, petsResult, apptResult] = await Promise.all([
        supabase
          .from('clients')
          .select('id,full_name,email,phone,created_at')
          .eq('id', id)
          .single(),
        supabase
          .from('pets')
          .select('id,name,breed')
          .eq('client_id', id)
          .order('id', { ascending: false }),
        supabase
          .from('appointments')
          .select('id,start_time,end_time,status,price,service_id,service')
          .eq('client_id', id)
          .order('start_time', { ascending: false })
          .limit(100),
      ]);

      if (cancelled) return;

      const fetchError = clientResult.error || petsResult.error || apptResult.error;
      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      setClient(clientResult.data);
      setPets(petsResult.data ?? []);
      setAppointments(apptResult.data ?? []);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const now = Date.now();
  const upcomingAppointments = appointments
    .filter((appt) => {
      const start = new Date(appt.start_time).getTime();
      return Number.isFinite(start) && start >= now;
    })
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const pastAppointments = appointments
    .filter((appt) => {
      const start = new Date(appt.start_time).getTime();
      return Number.isFinite(start) && start < now;
    })
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

  const lifetimeSpend = pastAppointments.reduce((total, appt) => total + Number(appt.price ?? 0), 0);
  const averageSpend = pastAppointments.length ? lifetimeSpend / pastAppointments.length : 0;

  let averageVisitIntervalWeeks: number | null = null;
  if (pastAppointments.length >= 2) {
    const sortedAsc = [...pastAppointments]
      .map((appt) => appt)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    const weekInMs = 7 * 24 * 60 * 60 * 1000;
    const intervals = [] as number[];
    for (let index = 1; index < sortedAsc.length; index += 1) {
      const prev = new Date(sortedAsc[index - 1].start_time).getTime();
      const curr = new Date(sortedAsc[index].start_time).getTime();
      if (Number.isFinite(prev) && Number.isFinite(curr) && curr > prev) {
        intervals.push((curr - prev) / weekInMs);
      }
    }
    if (intervals.length) {
      averageVisitIntervalWeeks = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    }
  }

  const recommendedVisitIntervalWeeks = 6;
  const nextAppointment = upcomingAppointments[0];
  const lastAppointment = pastAppointments[0];

  const showSkeleton = loading && !client;

  return (
    <PageContainer variant="compact" className="space-y-5">
      <div>
        <Link
          href="/clients"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-bubble transition hover:text-primary"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M14.53 5.47a.75.75 0 0 1 0 1.06L10.06 11l4.47 4.47a.75.75 0 0 1-1.06 1.06l-5-5a.75.75 0 0 1 0-1.06l5-5a.75.75 0 0 1 1.06 0Z"
              clipRule="evenodd"
            />
          </svg>
          Back to clients
        </Link>
      </div>

      {error && (
        <Card className="border-red-200/60 bg-red-100/60 text-red-700">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold">We couldn’t load this client.</p>
              <p className="text-sm text-red-700/80">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => router.refresh()}
              className="rounded-xl border border-red-300 bg-white/60 px-4 py-2 text-sm font-semibold text-red-700 shadow-soft transition hover:bg-white"
            >
              Try again
            </button>
          </div>
        </Card>
      )}

      {showSkeleton && (
        <Card className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 animate-pulse rounded-3xl bg-brand-bubble/30" />
            <div className="space-y-3">
              <div className="h-6 w-40 animate-pulse rounded-full bg-brand-bubble/20" />
              <div className="h-4 w-56 animate-pulse rounded-full bg-brand-bubble/10" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-2xl bg-brand-bubble/10" />
            ))}
          </div>
        </Card>
      )}

      {!loading && !client && !error && (
        <Card className="text-center text-brand-navy/70">
          <p className="text-lg font-semibold">Client not found</p>
          <p className="mt-2 text-sm">It looks like this profile no longer exists.</p>
        </Card>
      )}

      {!showSkeleton && client && (
        <>
          <Card className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-5">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-bubble to-brand-lavender text-2xl font-semibold text-primary shadow-soft">
                  {getInitials(client.full_name)}
                </div>
                <div className="space-y-3">
                  <div>
                    <h1 className="text-2xl font-bold text-primary-dark">
                      {client.full_name ?? 'Client'}
                    </h1>
                    <p className="text-sm text-brand-navy/60">
                      Client since {formatDate(client.created_at)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-brand-navy/80">
                    <a
                      className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 font-medium shadow-soft transition hover:bg-white"
                      href={client.email ? `mailto:${client.email}` : '#'}
                      aria-disabled={!client.email}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-4 w-4"
                        aria-hidden="true"
                      >
                        <path d="M1.5 6.75A3.75 3.75 0 0 1 5.25 3h13.5A3.75 3.75 0 0 1 22.5 6.75v10.5A3.75 3.75 0 0 1 18.75 21H5.25A3.75 3.75 0 0 1 1.5 17.25V6.75ZM5.25 4.5A2.25 2.25 0 0 0 3 6.75v.384l8.742 4.589a.75.75 0 0 0 .716 0L21 7.134V6.75A2.25 2.25 0 0 0 18.75 4.5H5.25ZM21 8.866l-8.334 4.372a2.25 2.25 0 0 1-2.132 0L3 8.866v8.384A2.25 2.25 0 0 0 5.25 19.5h13.5A2.25 2.25 0 0 0 21 17.25V8.866Z" />
                      </svg>
                      {client.email ?? 'No email on file'}
                    </a>
                    <a
                      className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 font-medium shadow-soft transition hover:bg-white"
                      href={client.phone ? `tel:${client.phone}` : '#'}
                      aria-disabled={!client.phone}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-4 w-4"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M1.5 4.125C1.5 3.089 2.34 2.25 3.375 2.25h2.674c.862 0 1.61.614 1.772 1.463l.616 3.256a1.875 1.875 0 0 1-.694 1.826l-1.327 1.06a11.347 11.347 0 0 0 4.644 4.644l1.06-1.327a1.875 1.875 0 0 1 1.826-.694l3.256.616c.85.16 1.463.91 1.463 1.772v2.674a1.875 1.875 0 0 1-1.875 1.875H18c-8.284 0-15-6.716-15-15v-.75Z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {client.phone ?? 'No phone on file'}
                    </a>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href={`/book?clientId=${client.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-brand-bubble/50 bg-brand-bubble/20 px-6 py-3 text-sm font-semibold text-primary shadow-soft transition hover:bg-brand-bubble/30"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path d="M12 4.5a.75.75 0 0 1 .75.75V11h5.75a.75.75 0 0 1 0 1.5H12.75v5.75a.75.75 0 0 1-1.5 0V12.5H5.5a.75.75 0 0 1 0-1.5h5.75V5.25A.75.75 0 0 1 12 4.5Z" />
                  </svg>
                  Add appointment
                </Link>
                <button
                  type="button"
                  onClick={() => router.refresh()}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/60 bg-white/80 px-6 py-3 text-sm font-semibold text-primary shadow-soft transition hover:bg-white"
                >
                  Refresh data
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-white/50 bg-white/70 p-4 shadow-soft">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-navy/60">Lifetime spend</p>
                <p className="mt-2 text-2xl font-bold text-primary-dark">{formatCurrency(lifetimeSpend)}</p>
                <p className="mt-1 text-xs text-brand-navy/60">
                  Across {pastAppointments.length || 'no'} completed visit{pastAppointments.length === 1 ? '' : 's'}
                </p>
              </div>
              <div className="rounded-2xl border border-white/50 bg-white/70 p-4 shadow-soft">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-navy/60">Average per visit</p>
                <p className="mt-2 text-2xl font-bold text-primary-dark">{formatCurrency(averageSpend)}</p>
                {lastAppointment && (
                  <p className="mt-1 text-xs text-brand-navy/60">Last visit {formatDate(lastAppointment.start_time)}</p>
                )}
              </div>
              <div className="rounded-2xl border border-white/50 bg-white/70 p-4 shadow-soft">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-navy/60">Recommended cadence</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-primary-dark">{recommendedVisitIntervalWeeks} weeks</p>
                  <span className="rounded-full bg-brand-bubble/20 px-2 py-0.5 text-xs font-semibold text-brand-bubble">Goal</span>
                </div>
                <p className="mt-1 text-xs text-brand-navy/60">
                  {averageVisitIntervalWeeks
                    ? `Actual average ${averageVisitIntervalWeeks.toFixed(1)} weeks`
                    : 'Not enough visits yet'}
                </p>
              </div>
              <div className="rounded-2xl border border-white/50 bg-white/70 p-4 shadow-soft">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-navy/60">Next appointment</p>
                {nextAppointment ? (
                  <div className="mt-2 space-y-1">
                    <p className="text-lg font-semibold text-primary-dark">{formatDate(nextAppointment.start_time)}</p>
                    <p className="text-sm text-brand-navy/70">{nextAppointment.service ?? `Service #${nextAppointment.service_id ?? '—'}`}</p>
                    <span className="inline-flex items-center gap-2 rounded-full bg-brand-bubble/20 px-2 py-0.5 text-xs font-semibold text-brand-bubble">
                      {nextAppointment.status ?? 'Scheduled'}
                    </span>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-brand-navy/60">No upcoming appointments scheduled.</p>
                )}
              </div>
            </div>
          </Card>

          <div className="grid gap-5 lg:grid-cols-[2fr,1fr]">
            <Card className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-semibold text-primary-dark">Appointments</h2>
                <div className="flex flex-wrap gap-2 text-xs font-semibold text-brand-navy/60">
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-bubble/15 px-3 py-1">
                    <span className="h-2 w-2 rounded-full bg-brand-bubble" /> Upcoming
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-lavender/20 px-3 py-1">
                    <span className="h-2 w-2 rounded-full bg-brand-lavender" /> Past
                  </span>
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-navy/60">Upcoming</h3>
                    <span className="text-xs text-brand-navy/50">{upcomingAppointments.length} scheduled</span>
                  </div>
                  {upcomingAppointments.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-brand-bubble/40 bg-white/60 px-4 py-6 text-sm text-brand-navy/70">
                      No upcoming appointments. Click “Add appointment” to get something on the books.
                    </div>
                  ) : (
                    upcomingAppointments.slice(0, 4).map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex items-start justify-between gap-4 rounded-2xl border border-brand-bubble/30 bg-brand-bubble/10 px-4 py-3"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-primary-dark">{formatDateTime(appointment.start_time)}</p>
                          <p className="text-sm text-brand-navy/70">
                            {appointment.service ?? `Service #${appointment.service_id ?? '—'}`}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 text-right">
                          <span className="inline-flex items-center rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold text-brand-bubble shadow-soft">
                            {appointment.status ?? 'Scheduled'}
                          </span>
                          <span className="text-xs font-semibold text-primary-dark">
                            {formatCurrency(appointment.price)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                  <Link
                    href={`/book?clientId=${client.id}`}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-brand-bubble/40 bg-white/70 px-4 py-2 text-sm font-semibold text-primary shadow-soft transition hover:bg-white"
                  >
                    Add another appointment
                  </Link>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-navy/60">Recent visits</h3>
                    <span className="text-xs text-brand-navy/50">{pastAppointments.length} total</span>
                  </div>
                  {pastAppointments.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-brand-lavender/40 bg-white/60 px-4 py-6 text-sm text-brand-navy/70">
                      No past appointments recorded yet.
                    </div>
                  ) : (
                    pastAppointments.slice(0, 6).map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex items-start justify-between gap-4 rounded-2xl border border-white/50 bg-white/80 px-4 py-3"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-primary-dark">{formatDate(appointment.start_time)}</p>
                          <p className="text-sm text-brand-navy/70">
                            {appointment.service ?? `Service #${appointment.service_id ?? '—'}`}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 text-right text-xs text-brand-navy/60">
                          <span className="font-semibold text-primary-dark">{formatCurrency(appointment.price)}</span>
                          <span>{appointment.status ?? 'Completed'}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Card>

            <Card className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-primary-dark">Pets</h2>
                <span className="text-xs font-semibold uppercase tracking-wide text-brand-navy/50">
                  {pets.length} on file
                </span>
              </div>
              {pets.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-brand-bubble/40 bg-white/60 px-4 py-8 text-center text-sm text-brand-navy/70">
                  No pets added for this client yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {pets.map((pet) => (
                    <div
                      key={pet.id}
                      className="flex items-center gap-4 rounded-2xl border border-white/50 bg-white/80 px-4 py-3 shadow-soft"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-lavender/30 text-sm font-semibold text-primary">
                        {(pet.name ?? 'Pet').slice(0, 1).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-base font-semibold text-primary-dark">{pet.name ?? 'Unnamed pet'}</p>
                        <p className="text-sm text-brand-navy/60">{pet.breed ?? 'Breed not recorded'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </PageContainer>
  );
}
