import { notFound } from "next/navigation";
import PageContainer from "@/components/PageContainer";
import { createClient } from "@/supabase/server";
import ProfileCard from "./components/ProfileCard";
import WeekScheduleWidget from "./components/WeekScheduleWidget";
import TodayWorkload from "./components/TodayWorkload";
import AppointmentsList from "./components/AppointmentsList";
import PerformanceCard from "./components/PerformanceCard";
import LifetimeTotalsCard from "./components/LifetimeTotalsCard";
import PreferencesEditor from "./components/PreferencesEditor";
import NotesCard from "./components/NotesCard";
import PayrollWidget from "./components/PayrollWidget";

type Params = { params: { id: string } };
type Employee = { id: string; name: string; active: boolean | null };

export default async function EmployeePage({ params }: Params) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("employees")
    .select("id,name,active")
    .eq("id", params.id)
    .single();

  if (error || !data) notFound();
  const employee = data as Employee;

  return (
    <PageContainer>
      <div className="grid gap-6 md:grid-cols-3">
        <ProfileCard
          employeeId={employee.id}
          name={employee.name}
          active={employee.active}
        />
        <WeekScheduleWidget employeeId={employee.id} />
        <TodayWorkload employeeId={employee.id} />
        <AppointmentsList employeeId={employee.id} />
        <PerformanceCard employeeId={employee.id} />
        <LifetimeTotalsCard employeeId={employee.id} />
        <PreferencesEditor employeeId={employee.id} />
        <NotesCard employeeId={employee.id} />
        <PayrollWidget employeeId={employee.id} />
      </div>
    </PageContainer>
  );
}
