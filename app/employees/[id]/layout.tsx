import { ReactNode } from "react";
import { notFound } from "next/navigation";

import { createClient } from "@/supabase/server";

import EmployeeDetailClient, {
  StaffGoals,
  StaffRecord,
} from "./EmployeeDetailClient";

interface LayoutProps {
  children: ReactNode;
  params: { id: string };
}

export default async function EmployeeLayout({ children, params }: LayoutProps) {
  const employeeId = Number(params.id);
  if (!Number.isFinite(employeeId)) {
    notFound();
  }

  const supabase = createClient();

  const { data: employee, error } = await supabase
    .from("employees")
    .select("*")
    .eq("id", employeeId)
    .maybeSingle();

  if (error || !employee) {
    notFound();
  }

  const { data: goals } = await supabase
    .from("staff_goals")
    .select("weekly_revenue_target, desired_dogs_per_day")
    .eq("staff_id", employeeId)
    .maybeSingle();

  return (
    <EmployeeDetailClient
      employee={employee as StaffRecord}
      goals={(goals ?? null) as StaffGoals | null}
    >
      {children}
    </EmployeeDetailClient>
  );
}
