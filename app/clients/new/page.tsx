'use client';

import Card from '@/components/Card';
import PageContainer from '@/components/PageContainer';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { FormEvent, useState } from 'react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export default function NewClientPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isFormValid = fullName.trim().length > 0;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setError('Please enter the client\'s name.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        full_name: trimmedName,
        email: email.trim() || null,
        phone: phone.trim() || null,
      } as const;

      const { data, error: insertError } = await supabase
        .from('clients')
        .insert(payload)
        .select('id')
        .single();

      if (insertError) {
        throw insertError;
      }

      if (!data?.id) {
        throw new Error('Client was created but no identifier was returned.');
      }

      router.replace(`/clients/${data.id}`);
      router.refresh();
    } catch (err: any) {
      const message = err?.message ?? 'Failed to create client.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer className="max-w-3xl">
      <Card className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-navy/50">Create client</p>
            <h1 className="text-3xl font-bold text-brand-navy">Add a new client</h1>
            <p className="text-sm text-brand-navy/70">
              Capture contact details to start booking appointments and assigning pets.
            </p>
          </div>
          <Link
            href="/clients"
            className="inline-flex items-center justify-center rounded-xl border border-white/40 bg-white/80 px-4 py-2 text-sm font-semibold text-brand-navy shadow-sm transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-brand-bubble/40"
          >
            Cancel
          </Link>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-300/60 bg-red-100/70 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-sm font-semibold text-brand-navy">
                Full name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                value={fullName}
                onChange={(event) => {
                  setFullName(event.target.value);
                  if (error) setError(null);
                }}
                placeholder="Jane Smith"
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-semibold text-brand-navy">
                Phone number <span className="font-normal text-brand-navy/60">(optional)</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={phone}
                onChange={(event) => {
                  setPhone(event.target.value);
                  if (error) setError(null);
                }}
                placeholder="(555) 123-4567"
                autoComplete="tel"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="email" className="text-sm font-semibold text-brand-navy">
                Email address <span className="font-normal text-brand-navy/60">(optional)</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (error) setError(null);
                }}
                placeholder="jane@example.com"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/clients"
              className="inline-flex items-center justify-center rounded-xl border border-white/40 bg-white/80 px-4 py-2 text-sm font-semibold text-brand-navy shadow-sm transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-brand-bubble/40"
            >
              Back to clients
            </Link>
            <button
              type="submit"
              disabled={!isFormValid || submitting}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-brand-bubble/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Saving…' : 'Create client'}
            </button>
          </div>
        </form>
      </Card>
    </PageContainer>
  );
}
