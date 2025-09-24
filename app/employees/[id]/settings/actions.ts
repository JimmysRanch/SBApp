"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { CompensationPlan } from "@/lib/compensationPlan";
import { toStoredPlan } from "@/lib/compensationPlan";
import {
  cleanNullableText,
  normalizeStatusLabel,
  normalizeTagList,
  toOptionalNumber,
} from "@/lib/employees/profile";

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
  const { status, isActive } = normalizeStatusLabel(input.status);
  const email = cleanNullableText(input.email)?.toLowerCase() ?? null;
  const payload = {
    name: cleanNullableText(input.name),
    role: cleanNullableText(input.role),
    email,
    phone: cleanNullableText(input.phone),
    avatar_url: cleanNullableText(input.avatar_url),
    address_street: cleanNullableText(input.address_street),
    address_city: cleanNullableText(input.address_city),
    address_state: cleanNullableText(input.address_state),
    address_zip: cleanNullableText(input.address_zip),
    emergency_contact_name: cleanNullableText(input.emergency_contact_name),
    emergency_contact_phone: cleanNullableText(input.emergency_contact_phone),
    status,
    active: isActive,
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
    app_permissions: Object.fromEntries(
      Object.entries(input.app_permissions ?? {}).map(([key, value]) => [key, Boolean(value)]),
    ),
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
  const preferredBreeds = normalizeTagList(input.preferred_breeds);
  const notAcceptedBreeds = normalizeTagList(input.not_accepted_breeds);
  const specialties = normalizeTagList(input.specialties);
  const weeklyTarget = toOptionalNumber(input.weeklyTarget);
  const dogsPerDay = toOptionalNumber(input.dogsPerDay);

  const { error: employeeError } = await supabase
    .from("employees")
    .update({
      preferred_breeds: preferredBreeds,
      not_accepted_breeds: notAcceptedBreeds,
      specialties,
    })
    .eq("id", staffId);

  const { error: goalsError } = await supabase
    .from("staff_goals")
    .upsert(
      {
        staff_id: staffId,
        weekly_revenue_target: weeklyTarget,
        desired_dogs_per_day: dogsPerDay,
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
