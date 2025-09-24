import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

const COMPLETED_STATUSES = ["Completed", "completed"] as const;

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

async function sumCompletedRevenue(
  supabase: SupabaseClient<any, any, any>,
  startIso: string,
  endIso: string,
) {
  const { data, error } = await supabase
    .from("appointments")
    .select("sum:total_price", { head: false })
    .in("status", [...COMPLETED_STATUSES])
    .gte("completed_at", startIso)
    .lte("completed_at", endIso)
    .maybeSingle();

  if (error) throw error;
  return toNumber((data as { sum: unknown } | null)?.sum ?? 0);
}

export default async function Revenue() {
  const supabase = createClient();
  const now = new Date();
  const nowIso = now.toISOString();

  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);

  try {
    const [todayRevenue, weekRevenue] = await Promise.all([
      sumCompletedRevenue(supabase, startOfDay.toISOString(), nowIso),
      sumCompletedRevenue(supabase, startOfWeek.toISOString(), nowIso),
    ]);

    return (
      <div className="space-y-4 text-white">
        <div className="rounded-3xl border border-white/20 bg-white/10 p-5 shadow-inner backdrop-blur">
          <p className="text-xs uppercase tracking-[0.35em] text-white/70">Today</p>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-3xl font-bold drop-shadow-sm">{currencyFormatter.format(todayRevenue)}</span>
            <span className="text-xs text-white/70">so far</span>
          </div>
        </div>
        <div className="rounded-3xl border border-white/20 bg-white/10 p-5 shadow-inner backdrop-blur">
          <p className="text-xs uppercase tracking-[0.35em] text-white/70">This Week</p>
          <div className="mt-2 text-xl font-semibold drop-shadow-sm">
            {currencyFormatter.format(weekRevenue)}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Failed to load revenue", error);
    return (
      <div className="rounded-3xl border border-red-200/40 bg-red-100/30 p-6 text-sm text-red-700 backdrop-blur">
        Failed to load revenue metrics.
      </div>
    );
  }
}
