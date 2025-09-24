import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Workload = {
  employeeName: string;
  count: number;
};

const ACTIVE_STATUSES = ["Checked In", "In Progress"] as const;

export default async function EmployeeWorkload() {
  noStore();
  const supabase = createClient();
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from("appointments")
    .select("groomer_name, status, start_time")
    .in("status", [...ACTIVE_STATUSES])
    .gte("start_time", startOfDay.toISOString())
    .lte("start_time", endOfDay.toISOString());

  if (error) {
    console.error("Failed to load employee workload", error);
    return (
      <div className="rounded-3xl border border-red-200/40 bg-red-100/30 p-6 text-sm text-red-700 backdrop-blur-lg">
        Failed to load employee workload.
      </div>
    );
  }

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const name = row.groomer_name ? String(row.groomer_name) : "Unassigned";
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  const workloads: Workload[] = Array.from(counts.entries()).map(([employeeName, count]) => ({
    employeeName,
    count,
  }));

  if (workloads.length === 0) {
    return (
      <div className="rounded-3xl border border-white/25 bg-white/10 p-6 text-white/85 backdrop-blur-lg">
        No active jobs.
      </div>
    );
  }

  const max = Math.max(...workloads.map((w) => w.count), 1);

  return (
    <ul className="space-y-3 text-white/90">
      {workloads.map((wl) => {
        const width = Math.max((wl.count / max) * 100, 12);
        return (
          <li
            key={wl.employeeName}
            className="rounded-3xl border border-white/15 bg-white/10 p-4 shadow-inner backdrop-blur"
          >
            <div className="flex items-center justify-between text-sm font-semibold tracking-tight">
              <span>{wl.employeeName}</span>
              <span className="flex items-center gap-1 text-xs uppercase">
                <span className="inline-flex h-2 w-2 rounded-full bg-white/80" />
                {wl.count} {wl.count === 1 ? "dog" : "dogs"}
              </span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-white/80"
                style={{ width: `${width}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
