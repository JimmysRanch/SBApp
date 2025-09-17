"use client";

import clsx from "clsx";

export type RecentJobRow = {
  id: number;
  start: string;
  pet: string | null;
  service: string | null;
  price: number | null;
  status: string | null;
};

type RecentJobsProps = {
  loading: boolean;
  rows: RecentJobRow[];
  onSelect: (id: number) => void;
};

function formatCurrency(value: number | null) {
  if (value === null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export default function RecentJobs({ loading, rows, onSelect }: RecentJobsProps) {
  const hasRows = rows.length > 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-brand-navy">Recent Appointments</h2>
          <p className="text-sm text-slate-500">Latest eight rows across any status</p>
        </div>
      </header>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2">Date / Time</th>
              <th className="px-3 py-2">Pet / Service</th>
              <th className="px-3 py-2">Price</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-slate-400">
                  Loading recent appointments…
                </td>
              </tr>
            )}
            {!loading && !hasRows && (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-slate-400">
                  No records
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onSelect(row.id)}
                  className="cursor-pointer transition hover:bg-slate-50"
                >
                  <td className="px-3 py-2 text-slate-600">{new Date(row.start).toLocaleString()}</td>
                  <td className="px-3 py-2 text-slate-600">
                    <div className="font-medium text-brand-navy">{row.pet ?? "—"}</div>
                    <div className="text-xs text-slate-400">{row.service ?? "—"}</div>
                  </td>
                  <td className="px-3 py-2 text-slate-600">{formatCurrency(row.price)}</td>
                  <td className="px-3 py-2">
                    <StatusPill status={row.status} />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

type StatusPillProps = {
  status: string | null;
};

function StatusPill({ status }: StatusPillProps) {
  if (!status) {
    return <span className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500">—</span>;
  }
  const normalized = status.toLowerCase();
  const classes = clsx(
    "rounded-full border px-3 py-1 text-xs font-semibold capitalize",
    normalized.includes("completed") && "border-emerald-200 bg-emerald-50 text-emerald-700",
    normalized.includes("cancel") && "border-rose-200 bg-rose-50 text-rose-600",
    normalized.includes("no-show") && "border-amber-200 bg-amber-50 text-amber-600",
    normalized.includes("progress") && "border-indigo-200 bg-indigo-50 text-indigo-600",
    normalized.includes("scheduled") && "border-sky-200 bg-sky-50 text-sky-600"
  );
  return <span className={classes}>{status}</span>;
}
