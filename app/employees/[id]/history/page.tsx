import { createServerClient } from '@/lib/supabase/server';

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
});

const asNumber = (value: number | string | null | undefined) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const formatCurrency = (value: number | string | null | undefined) =>
  asNumber(value).toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default async function StaffHistory({ params }: { params: { id: string } }) {
  const supabase = createServerClient();
  const { data: rows } = await supabase
    .from('appointments')
    .select('id, starts_at, ends_at, service_name, price, pet_name, status, tips')
    .eq('staff_id', params.id)
    .order('starts_at', { ascending: false })
    .limit(200);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <h2 className="mb-3 text-lg font-semibold text-neutral-900">Appointment History</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-neutral-600">
            <tr className="border-b border-neutral-200">
              <th className="py-2 pr-4 font-medium">Date</th>
              <th className="py-2 pr-4 font-medium">Pet</th>
              <th className="py-2 pr-4 font-medium">Service</th>
              <th className="py-2 pr-4 font-medium">Price</th>
              <th className="py-2 pr-4 font-medium">Tips</th>
              <th className="py-2 pr-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows?.map((row) => (
              <tr key={row.id} className="border-b border-neutral-200 last:border-b-0">
                <td className="py-2 pr-4 text-neutral-700">
                  {row.starts_at ? dateTimeFormatter.format(new Date(row.starts_at)) : ''}
                </td>
                <td className="py-2 pr-4 text-neutral-700">{row.pet_name}</td>
                <td className="py-2 pr-4 text-neutral-700">{row.service_name}</td>
                <td className="py-2 pr-4 text-neutral-700">{formatCurrency(row.price)}</td>
                <td className="py-2 pr-4 text-neutral-700">{formatCurrency(row.tips)}</td>
                <td className="py-2 pr-4 text-neutral-700">{row.status}</td>
              </tr>
            ))}
            {!rows?.length && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-sm text-neutral-500">
                  No appointments recorded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
