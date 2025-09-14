export const runtime = "nodejs";
import { notFound } from "next/navigation";
import PageContainer from "@/components/PageContainer";
import { createClient } from "@/supabase/server";
import ProfileCard from "./components/ProfileCard";
import WeekScheduleWidget from "./components/WeekScheduleWidget";
import TodayWorkload from "./components/TodayWorkload";
import AppointmentsList from "./components/AppointmentsList";
import PerformanceCard from "./components/PerformanceCard";
import LifetimeTotalsCard from "./components/LifetimeTotalsCard";
import PayrollWidget from "./components/PayrollWidget";
import NotesCard from "./components/NotesCard";

type Params = { params: { id: string } };

export default async function EmployeePage({ params }: Params) {
  const supabase = createClient();
  const empId = Number(params.id);
  const { data: employee, error } = await supabase
    .from("employees")
    .select("*")
    .eq("id", empId)
    .single();
  if (error || !employee) notFound();

  return (
    <PageContainer>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-4">
          <ProfileCard employee={employee} />
          <WeekScheduleWidget employeeId={empId} />
          <NotesCard employeeId={empId} />
        </div>
        <div className="space-y-4">
          <TodayWorkload employeeId={empId} />
          <AppointmentsList employeeId={empId} kind="upcoming" />
          <AppointmentsList employeeId={empId} kind="past" />
        </div>
        <div className="space-y-4">
          <PerformanceCard employeeId={empId} />
          <LifetimeTotalsCard employeeId={empId} />
          <PayrollWidget employeeId={empId} />
        </div>
      </div>
    </PageContainer>
  );
}
