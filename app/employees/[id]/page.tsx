export const runtime = "nodejs";

import { notFound } from "next/navigation";
import PageContainer from "@/components/PageContainer";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

import ProfileCard from "./components/ProfileCard";
import WeekScheduleWidget from "./components/WeekScheduleWidget";
import TodayWorkload from "./components/TodayWorkload";
import AppointmentsList from "./components/AppointmentsList";
import PerformanceCard from "./components/PerformanceCard";
import LifetimeTotalsCard from "./components/LifetimeTotalsCard";
import PayrollWidget from "./components/PayrollWidget";
import NotesCard from "./components/NotesCard";

interface Params {
  params: {
    id: string;
  };
}

export default async function EmployeePage({ params }: Params) {
  const supabase = createClient();
  const empId = Number(params.id);
  const { data: employee, error } = await supabase
    .from("employees")
    .select("*")
    .eq("id", empId)
    .single();

  if (error || !employee) {
    notFound();
  }

  return (
    <PageContainer>
      {/* Navigation links to subpages */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href={`/employees/${empId}/schedule`}
          className="px-3 py-1 rounded-md bg-blue-500 text-white hover:bg-blue-600"
        >
          Schedule
        </Link>
        <Link
          href={`/employees/${empId}/payroll`}
          className="px-3 py-1 rounded-md bg-blue-500 text-white hover:bg-blue-600"
        >
          Payroll
        </Link>
        <Link
          href={`/employees/${empId}/history`}
          className="px-3 py-1 rounded-md bg-blue-500 text-white hover:bg-blue-600"
        >
          History
        </Link>
        <Link
          href={`/employees/${empId}/settings`}
          className="px-3 py-1 rounded-md bg-blue-500 text-white hover:bg-blue-600"
        >
          Settings
        </Link>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div>
          <ProfileCard employee={employee} />
          <WeekScheduleWidget employee={employee} />
          <NotesCard employeeId={empId} />
        </div>
        <div>
          <TodayWorkload employeeId={empId} />
          <AppointmentsList employeeId={empId} />
        </div>
        <div className="flex flex-col space-y-4">
          <PerformanceCard employeeId={empId} />
          <LifetimeTotalsCard employeeId={empId} />
          <PayrollWidget employeeId={empId} />
        </div>
      </div>
    </PageContainer>
  );
}
