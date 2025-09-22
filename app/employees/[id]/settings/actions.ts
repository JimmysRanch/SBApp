"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { CompensationPlan } from "@/lib/compensationPlan";
import { toStoredPlan } from "@/lib/compensationPlan";

export async function saveProfileAction(
  staffId: number,
  input: {
    name: string;
    role: string;
    email: string;
    phone: string;
    avatar_url: string;
    status: string;
    address_street: string;
    address_city: string;
    address_state: string;
    address_zip: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
  }
) {
  const supabase = createClient();
  const status = input.status || "Active";
  const payload = {
    name: input.name || null,
    role: input.role || null,
    email: input.email || null,
    phone: input.phone || null,
    avatar_url: input.avatar_url || null,
    address_street: input.address_street || null,
    address_city: input.address_city || null,
    address_state: input.address_state || null,
    address_zip: input.address_zip || null,
    emergency_contact_name: input.emergency_contact_name || null,
    emergency_contact_phone: input.emergency_contact_phone || null,
    status,
    active: status.toLowerCase().includes("active"),
  };
  const { error } = await supabase.from("employees").update(payload).eq("id", staffId);
  if (error) {
    return { success: false, error: error.message };
  }
  revalidatePath(`/employees/${staffId}/settings`);
  return { success: true };
}

export async function saveCompensationAction(
  staffId: number,
  input: {
    pay_type: string;
    commission_rate: number;
    hourly_rate: number;
    salary_rate: number;
    compensation_plan: CompensationPlan;
    app_permissions: Record<string, boolean>;
  }
) {
  const supabase = createClient();
  const payload = {
    pay_type: input.pay_type,
    commission_rate: Number.isFinite(input.commission_rate) ? input.commission_rate : 0,
    hourly_rate: Number.isFinite(input.hourly_rate) ? input.hourly_rate : 0,
    salary_rate: Number.isFinite(input.salary_rate) ? input.salary_rate : 0,
    compensation_plan: toStoredPlan(input.compensation_plan),
    app_permissions: input.app_permissions,
  };
  const { error } = await supabase.from("employees").update(payload).eq("id", staffId);
  if (error) {
    return { success: false, error: error.message };
  }
  revalidatePath(`/employees/${staffId}/settings`);
  return { success: true };
}

export async function savePreferencesAction(
  staffId: number,
  input: {
    preferred_breeds: string[];
    not_accepted_breeds: string[];
    specialties: string[];
    weeklyTarget: number | null;
    dogsPerDay: number | null;
  }
) {
  const supabase = createClient();
  const { error: employeeError } = await supabase
    .from("employees")
    .update({
      preferred_breeds: input.preferred_breeds,
      not_accepted_breeds: input.not_accepted_breeds,
      specialties: input.specialties,
    })
    .eq("id", staffId);

  const { error: goalsError } = await supabase
    .from("staff_goals")
    .upsert(
      {
        staff_id: staffId,
        weekly_revenue_target: input.weeklyTarget,
        desired_dogs_per_day: input.dogsPerDay,
      },
      { onConflict: "staff_id" }
    );

  if (employeeError || goalsError) {
    return { success: false, error: employeeError?.message ?? goalsError?.message ?? "Unable to save preferences" };
  }
  revalidatePath(`/employees/${staffId}/settings`);
  return { success: true };
}

export async function saveManagerNotesAction(staffId: number, notes: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("employees")
    .update({ manager_notes: notes?.trim() ? notes : null })
    .eq("id", staffId);
  if (error) {
    return { success: false, error: error.message };
  }
  revalidatePath(`/employees/${staffId}/settings`);
  return { success: true };
}
