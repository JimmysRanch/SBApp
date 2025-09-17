import { createServerClient } from "@/lib/supabase/server";

interface RecentJobsProps {
  staffId: string;
  limit?: number;
}

export default async function RecentJobs({ staffId, limit = 8 }: RecentJobsProps) {
  const supabase = createServerClient();
  const { data: rows } = await supabase
    .from("appointments")
    .select("id, start_time, service, price")
    .eq("employee_id", Number(staffId))
    .order("start_time", { ascending: false })
    .limit(limit);

  return (
    <div className="rounded-xl border bg-white p-4">
      <h3 className="mb-2 font-semibold">Recent Appointments</h3>
      <ul className="divide-y">
        {rows?.map((row) => (
          <li key={row.id} className="flex justify-between py-2">
            <span>
              {row.start_time ? new Date(row.start_time).toLocaleDateString() : ""} — {row.service}
            </span>
            <span className="font-medium">${Number(row.price ?? 0).toFixed(2)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
