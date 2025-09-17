"use client";

import clsx from "clsx";

export type OverviewMetrics = {
  todayDogs: number;
  todayHours: number;
  weekDogs: number;
  weekRevenue: number;
  weekCommission: number;
  lifetimeDogs: number;
  lifetimeRevenue: number;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

type OverviewWidgetsProps = {
  loading: boolean;
  metrics: OverviewMetrics;
  weeklyTarget: number | null;
  dogsTarget: number | null;
};

export default function OverviewWidgets({ loading, metrics, weeklyTarget, dogsTarget }: OverviewWidgetsProps) {
  const progress = weeklyTarget && weeklyTarget > 0 ? Math.min(metrics.weekRevenue / weeklyTarget, 1) : 0;

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <WidgetCard title="Today" loading={loading}>
        <div className="text-sm text-slate-500">{metrics.todayDogs} dogs</div>
        <div className="text-xs text-slate-400">{metrics.todayHours.toFixed(1)} h</div>
      </WidgetCard>
      <WidgetCard title="This Week" loading={loading}>
        <div className="text-sm text-slate-500">{metrics.weekDogs} dogs</div>
        <div className="text-xs text-slate-400">
          {formatCurrency(metrics.weekRevenue)} · {formatCurrency(metrics.weekCommission)}
        </div>
      </WidgetCard>
      <WidgetCard title="Lifetime" loading={loading}>
        <div className="text-sm text-slate-500">{metrics.lifetimeDogs} dogs</div>
        <div className="text-xs text-slate-400">{formatCurrency(metrics.lifetimeRevenue)}</div>
      </WidgetCard>
      <WidgetCard title="Goal vs Actual" loading={loading}>
        <div className="text-xs text-slate-400">
          {weeklyTarget
            ? `Goal ${formatCurrency(weeklyTarget)} / wk`
            : dogsTarget
            ? `Goal ${dogsTarget} dogs / day`
            : "Goal not set"}
        </div>
        <div className="text-sm font-medium text-slate-500">Actual {formatCurrency(metrics.weekRevenue)}</div>
        {weeklyTarget ? (
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-brand-hotpink" style={{ width: `${progress * 100}%` }} />
          </div>
        ) : (
          <p className="mt-2 text-xs text-slate-400">Set a weekly target to track progress</p>
        )}
      </WidgetCard>
    </section>
  );
}

type WidgetCardProps = {
  title: string;
  loading: boolean;
  children: React.ReactNode;
};

function WidgetCard({ title, loading, children }: WidgetCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      <div className={clsx("mt-2 min-h-[56px] text-sm text-slate-600", loading && "animate-pulse text-transparent")}>{children}</div>
    </div>
  );
}
