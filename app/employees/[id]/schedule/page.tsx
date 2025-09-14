import { notFound } from "next/navigation";
import PageContainer from "@/components/PageContainer";
import { createClient } from "@/lib/supabase/server";
import ScheduleEditor from "../components/ScheduleEditor";

interface Params {
  id: string;
}

export default async function EmployeeSchedulePage({
  params,
}: {
  params: Params;
}) {
  const supabase = createClient();
  const empId = Number(params.id);
  const { data: employee, error } = await supabase
    .from("employees")
    .select("id, schedule")
    .eq("id", empId)
    .single();

  if (error || !employee) {
    notFound();
  }

  return (
    <PageContainer>
      {/* Title could be added here if desired */}
      <ScheduleEditor employeeId={params.id} initialSchedule={employee.schedule} />
    </PageContainer>
  );
}
