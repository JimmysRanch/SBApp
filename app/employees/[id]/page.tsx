import { notFound } from "next/navigation";
import PageContainer from "@/components/PageContainer";
import Card from "@/components/Card";
import { createClient } from "@/supabase/server";

type Params = { params: { id: string } };

export const runtime = "nodejs";

export default async function EmployeePage({ params }: Params) {
  const supabase = createClient();

  // Get employee profile
  const { data: employee } = await supabase
    .from("employees")
    .select("id,name,status")
    .eq("id", params.id)
    .single();

  if (!employee) notFound();

  // Get schedule
  const { data: schedule } = await supabase
    .from("employee_schedule")
    .select("day,is_working,start_time,end_time")
    .eq("employee_id", params.id);

  // Get workload
  const { data: workload } = await supabase
    .from("v_employee_today_workload")
    .select("*")
    .eq("employee_id", params.id)
    .single();

  // Get performance (week)
  const { data: perf } = await supabase
    .from("v_employee_wtd")
    .select("*")
    .eq("employee_id", params.id)
    .single();

  // Get lifetime totals
  const { data: lifetime } = await supabase
    .from("employee_metrics_lifetime")
    .select("*")
    .eq("employee_id", params.id)
    .single();

  // Get notes
  const { data: notes } = await supabase
    .from("employee_notes")
    .select("note")
    .eq("employee_id", params.id);

  return (
    <PageContainer>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <Card>
          <h2 className="text-xl font-bold">Profile</h2>
          <p>ID: {employee.id}</p>
          <p>Name: {employee.name}</p>
          <p>Status: {employee.status}</p>
        </Card>

        <Card>
          <h2 className="text-xl font-bold">Week Schedule</h2>
          <ul>
            {schedule?.map((s) => (
              <li key={s.day}>
                {s.day}: {s.is_working ? `${s.start_time} - ${s.end_time}` : "Off"}
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="text-xl font-bold">Today&apos;s Workload</h2>
          <p>Dogs Today: {workload?.dogs_today ?? 0}</p>
          <p>Hours: {workload?.hours_today ?? 0}</p>
          <p>Completed: {workload?.completed_today ?? 0}</p>
        </Card>

        <Card>
          <h2 className="text-xl font-bold">Performance</h2>
          <p>Dogs Groomed This Week: {perf?.dogs_wtd ?? 0}</p>
          <p>Revenue This Week: ${(perf?.revenue_cents_wtd ?? 0) / 100}</p>
        </Card>

        <Card>
          <h2 className="text-xl font-bold">Lifetime Totals</h2>
          <p>Total Grooms: {lifetime?.total_grooms ?? 0}</p>
        </Card>

        <Card>
          <h2 className="text-xl font-bold">Payroll</h2>
          <p>Payroll summary coming soon</p>
        </Card>

        <Card>
          <h2 className="text-xl font-bold">Notes</h2>
          <ul>
            {notes?.map((n, i) => (
              <li key={i}>{n.note}</li>
            ))}
          </ul>
        </Card>
      </div>
    </PageContainer>
  );
}
