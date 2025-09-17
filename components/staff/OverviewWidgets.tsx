const asNumber = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const formatCurrency = (value: unknown, fractionDigits = 0) => {
  const amount = asNumber(value);
  return amount.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
};

export default function OverviewWidgets({
  today,
  weekly,
  lifetime,
  goals,
}: {
  today: Record<string, unknown> | null;
  weekly: Record<string, unknown> | null;
  lifetime: Record<string, unknown> | null;
  goals: Record<string, unknown> | null;
}) {
  const cards = [
    {
      label: 'Today',
      a: `${asNumber(today?.dogs)} Dogs`,
      b: `${asNumber(today?.hours)} h`,
    },
    {
      label: 'This Week',
      a: `${asNumber(weekly?.dogs)} Dogs`,
      b: `${formatCurrency(weekly?.revenue)} · ${formatCurrency(weekly?.commission)}`,
    },
    {
      label: 'Lifetime',
      a: `${asNumber(lifetime?.dogs)} Dogs`,
      b: formatCurrency(lifetime?.revenue),
    },
    {
      label: 'Goal vs Actual',
      a: `Goal ${formatCurrency(goals?.weekly_revenue_target)}/wk`,
      b: `Actual ${formatCurrency(weekly?.revenue)}`,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {card.label}
          </div>
          <div className="mt-1 text-lg font-semibold text-neutral-900">{card.a}</div>
          <div className="text-sm text-neutral-600">{card.b}</div>
        </div>
      ))}
    </div>
  );
}
