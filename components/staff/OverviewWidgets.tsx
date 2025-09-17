interface MetricsRow {
  dogs?: number | null;
  hours?: number | null;
  revenue?: number | null;
  commission?: number | null;
}

interface GoalsRow {
  weekly_revenue_target?: number | null;
  desired_dogs_per_day?: number | null;
}

interface OverviewWidgetsProps {
  today: MetricsRow | null;
  weekly: MetricsRow | null;
  lifetime: MetricsRow | null;
  goals: GoalsRow | null;
}

export default function OverviewWidgets({ today, weekly, lifetime, goals }: OverviewWidgetsProps) {
  const cards = [
    {
      label: "Today",
      a: `${today?.dogs ?? 0} Dogs`,
      b: `${Number(today?.hours ?? 0).toFixed(1)} h`,
    },
    {
      label: "This Week",
      a: `${weekly?.dogs ?? 0} Dogs`,
      b: `$${Number(weekly?.revenue ?? 0).toFixed(0)} · $${Number(weekly?.commission ?? 0).toFixed(0)}`,
    },
    {
      label: "Lifetime",
      a: `${lifetime?.dogs ?? 0} Dogs`,
      b: `$${Number(lifetime?.revenue ?? 0).toFixed(0)}`,
    },
    {
      label: "Goal vs Actual",
      a: `Goal $${Number(goals?.weekly_revenue_target ?? 0).toFixed(0)}/wk`,
      b: `Actual $${Number(weekly?.revenue ?? 0).toFixed(0)}`,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 p-1 md:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border bg-white p-4">
          <div className="text-xs uppercase text-neutral-500">{card.label}</div>
          <div className="text-lg font-semibold">{card.a}</div>
          <div className="text-sm text-neutral-600">{card.b}</div>
        </div>
      ))}
    </div>
  );
}
