export const runtime = "nodejs";
import PageContainer from "@/components/PageContainer";
import { createClient } from "@/supabase/server";

type Params = { params: { id: string } };

function iso(d: Date) { return d.toISOString(); }

export default async function EmployeeSchedulePage({ params }: Params) {
  const supabase = createClient();
  const empId = Number(params.id);

  const start = new Date(); start.setHours(0,0,0,0);
  const end = new Date(start); end.setDate(start.getDate()+14);

  const { data: appts } = await supabase
    .from("appointments")
    .select("id,start_time,end_time,status,service")
    .eq("employee_id", empId)
    .gte("start_time", iso(start))
    .lt("start_time", iso(end))
    .order("start_time", { ascending: true });

  // simple agenda list
  return (
    <PageContainer>
      <h1 className="text-2xl font-bold mb-4">Schedule (Next 14 Days)</h1>
      <div className="space-y-2">
        {(appts ?? []).length === 0 && <p className="text-gray-600">No appointments.</p>}
        {(appts ?? []).map(a => (
          <div key={a.id} className="rounded border p-3 flex items-center justify-between">
            <div>
              <div className="font-semibold">{new Date(a.start_time).toLocaleString()}</div>
              <div className="text-sm text-gray-600">{a.service ?? "Service"}</div>
            </div>
            <div className="text-sm text-gray-700">{a.status}</div>
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
