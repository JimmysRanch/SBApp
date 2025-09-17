import { createServerClient } from '@/lib/supabase/server';

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const asNumber = (value: number | string | null | undefined) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

export default async function RecentJobs({
  staffId,
  limit = 8,
}: {
  staffId: string;
  limit?: number;
}) {
  const supabase = createServerClient();
  const { data: rows } = await supabase
    .from('appointments')
    .select('id, starts_at, pet_name, service_name, price')
    .eq('staff_id', staffId)
    .order('starts_at', { ascending: false })
    .limit(limit);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <h3 className="mb-2 text-base font-semibold text-neutral-900">Recent Appointments</h3>
      <ul className="divide-y divide-neutral-200">
        {rows?.map((row) => {
          const price = currencyFormatter.format(asNumber(row.price));
          const date = row.starts_at ? dateFormatter.format(new Date(row.starts_at)) : '';
          return (
            <li key={row.id} className="flex items-center justify-between py-2 text-sm">
              <span className="text-neutral-700">
                {date}
                {row.pet_name ? ` — ${row.pet_name}` : ''}
                {row.service_name ? ` (${row.service_name})` : ''}
              </span>
              <span className="font-medium text-neutral-900">{price}</span>
            </li>
          );
        })}
        {!rows?.length && (
          <li className="py-4 text-sm text-neutral-500">No recent appointments logged.</li>
        )}
      </ul>
    </div>
  );
}
