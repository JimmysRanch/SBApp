import { createServerClient } from "@/lib/supabase/server";

interface StaffHistoryProps {
  params: { id: string };
}

export default async function StaffHistory({ params }: StaffHistoryProps) {
  const supabase = createServerClient();
  const staffId = Number(params.id);
  const { data: rows } = await supabase
    .from("appointments")
    .select("id, start_time, end_time, service, price, status")
    .eq("employee_id", staffId)
    .order("start_time", { ascending: false })
    .limit(200);

  return (
    <div className="m-4 rounded-xl border bg-white p-4">
      <h2 className="mb-3 text-lg font-semibold">Appointment History</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-neutral-600">
            <tr>
              <th>Date</th>
              <th>Service</th>
              <th>Price</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows?.map((row) => (
              <tr key={row.id} className="border-t">
                <td>{row.start_time ? new Date(row.start_time).toLocaleString() : ""}</td>
                <td>{row.service}</td>
                <td>${Number(row.price ?? 0).toFixed(2)}</td>
                <td>{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
