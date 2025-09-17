import { createServerClient } from '@/lib/supabase/server';

type PayrollPageProps = {
  params: { id: string };
};

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
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

const formatPercent = (value: number | string | null | undefined) => {
  const amount = asNumber(value);
  const fractionDigits = Number.isInteger(amount) ? 0 : 2;
  return `${amount.toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}%`;
};

export default async function Payroll({ params }: PayrollPageProps) {
  const supabase = createServerClient();
  const { data: lines } = await supabase
    .from('payroll_lines_view')
    .select('*')
    .eq('staff_id', params.id)
    .order('starts_at', { ascending: true });

  let week1 = 0;
  let week2 = 0;
  let grand = 0;

  lines?.forEach((line) => {
    const amount = asNumber(line.final_earnings);
    const weekIndex = Math.round(asNumber(line.week_index));
    grand += amount;
    if (weekIndex === 1) {
      week1 += amount;
    } else if (weekIndex === 2) {
      week2 += amount;
    }
  });

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-neutral-900">Paycheck Details</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-neutral-600">
              <tr className="border-b border-neutral-200">
                <th className="py-2 pr-4 font-medium">Date &amp; Time</th>
                <th className="py-2 pr-4 font-medium">Pet / Service</th>
                <th className="py-2 pr-4 font-medium">Base</th>
                <th className="py-2 pr-4 font-medium">Commission</th>
                <th className="py-2 pr-4 font-medium">Adjustment</th>
                <th className="py-2 pr-4 font-medium">Final</th>
                <th className="py-2 pr-4 font-medium">Reason</th>
              </tr>
            </thead>
            <tbody>
              {lines?.map((line) => {
                const base = currencyFormatter.format(asNumber(line.base_price));
                const commissionAmount = currencyFormatter.format(asNumber(line.commission_amount));
                const adjustmentAmount = asNumber(line.adjustment_amount);
                const hasAdjustment = adjustmentAmount > 0;
                const adjustment = hasAdjustment
                  ? `-${currencyFormatter.format(adjustmentAmount)}`
                  : '-';
                const final = currencyFormatter.format(asNumber(line.final_earnings));
                const startsAt = line.starts_at ? new Date(line.starts_at) : null;
                const endsAt = line.ends_at ? new Date(line.ends_at) : null;
                const dateLabel = startsAt ? dateTimeFormatter.format(startsAt) : '';
                const endLabel = endsAt ? timeFormatter.format(endsAt) : '';

                return (
                  <tr key={line.id} className="border-b border-neutral-200 last:border-b-0">
                    <td className="py-2 pr-4 text-neutral-700">
                      {dateLabel}
                      {endLabel ? ` – ${endLabel}` : ''}
                    </td>
                    <td className="py-2 pr-4 text-neutral-700">
                      {[line.pet_name, line.service_name].filter(Boolean).join(' — ')}
                    </td>
                    <td className="py-2 pr-4 text-neutral-700">{base}</td>
                    <td className="py-2 pr-4 text-neutral-700">
                      {`${formatPercent(line.commission_rate)} → ${commissionAmount}`}
                    </td>
                    <td className="py-2 pr-4 text-neutral-700">{adjustment}</td>
                    <td className="py-2 pr-4 font-medium text-neutral-900">{final}</td>
                    <td className="py-2 pr-4 text-neutral-700">{line.adjustment_reason ?? ''}</td>
                  </tr>
                );
              })}
              {!lines?.length && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-sm text-neutral-500">
                    No payroll lines recorded for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-sm text-neutral-600">Week 1 Total</div>
          <div className="text-2xl font-semibold text-neutral-900">{currencyFormatter.format(week1)}</div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-sm text-neutral-600">Week 2 Total</div>
          <div className="text-2xl font-semibold text-neutral-900">{currencyFormatter.format(week2)}</div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-sm text-neutral-600">Pay Period Total</div>
          <div className="text-2xl font-semibold text-neutral-900">{currencyFormatter.format(grand)}</div>
        </div>
      </div>
    </div>
  );
}
