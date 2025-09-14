export const runtime = "nodejs";
import { notFound } from "next/navigation";
import PageContainer from "@/components/PageContainer";
import Card from "@/components/Card";
import { createClient } from "@/supabase/server";

type Params = { params: { id: string } };

export default async function EmployeePage({ params }: Params) {
  const supabase = createClient();
  const empId = Number(params.id);

  const { data: employee, error: eErr } = await supabase
    .from("employees")
    .select("id,name,active")
    .eq("id", empId)
    .single();
  if (eErr || !employee) notFound();

  const { data: workload } = await supabase
    .from("v_employee_today_workload")
    .select("*")
    .eq("employee_id", empId)
    .maybeSingle();

  const { data: wtd } = await supabase
    .from("v_employee_wtd")
    .select("*")
    .eq("employee_id", empId)
    .maybeSingle();

  return (
    <PageContainer>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <h2 className="text-xl font-bold">Profile</h2>
          <p>ID: {employee.id}</p>
          <p>Name: {employee.name}</p>
          <p>Status: {employee.active ? "Active" : "Inactive"}</p>
        </Card>
        <Card>
          <h2 className="text-xl font-bold">Today’s Workload</h2>
          <p>Dogs Today: {workload?.dogs_today ?? 0}</p>
          <p>Hours: {Number(workload?.hours_today ?? 0).toFixed(2)}</p>
          <p>Completed: {workload?.completed_today ?? 0}</p>
        </Card>
        <Card>
          <h2 className="text-xl font-bold">Performance</h2>
          <p>Dogs This Week: {wtd?.dogs_wtd ?? 0}</p>
        </Card>
      </div>
    </PageContainer>
  );
}
