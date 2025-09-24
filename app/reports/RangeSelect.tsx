'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

import { RANGE_LABELS, RANGE_OPTIONS, type RangeOption } from './range';

type RangeSelectProps = {
  id?: string;
  value: RangeOption;
  className?: string;
};

export default function RangeSelect({ id, value, className = '' }: RangeSelectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  return (
    <select
      id={id}
      value={value}
      onChange={(event) => {
        const next = event.target.value as RangeOption;
        const params = new URLSearchParams(searchParams.toString());
        if (next === 'today') {
          params.delete('range');
        } else {
          params.set('range', next);
        }
        const query = params.toString();
        startTransition(() => {
          router.replace(query ? `/reports?${query}` : '/reports');
        });
      }}
      disabled={isPending}
      className={`rounded-full border border-gray-300 px-3 py-2 ${className}`}
    >
      {RANGE_OPTIONS.map((option) => (
        <option key={option} value={option}>
          {RANGE_LABELS[option]}
        </option>
      ))}
    </select>
  );
}
