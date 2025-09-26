import { ReactNode } from "react";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { normaliseRole, type Role } from "@/lib/auth/profile";

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

  const { user_id: profileId } = employee as { user_id?: string | null };

  let resolvedRole: Role | null = null;
  if (profileId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", profileId)
      .maybeSingle();

    resolvedRole = profile?.role ? normaliseRole(profile.role) : null;
  }

  const staffRecord = {
    ...(employee as Omit<StaffRecord, "role">),
    role: resolvedRole,
  } satisfies StaffRecord;

  const { data: goals } = await supabase
    .from("staff_goals")
    .select("weekly_revenue_target, desired_dogs_per_day")
    .eq("staff_id", employeeId)
    .maybeSingle();

  return (
    <EmployeeDetailClient
      employee={staffRecord}
      goals={(goals ?? null) as StaffGoals | null}
    >
      {children}
    </EmployeeDetailClient>
  );
}
