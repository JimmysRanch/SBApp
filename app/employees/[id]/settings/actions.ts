"use server";

import { revalidatePath } from "next/cache";

import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import { createClient, getSupabaseAdmin } from "@/lib/supabase/server";
import type { CompensationPlan } from "@/lib/compensationPlan";
import { toStoredPlan } from "@/lib/compensationPlan";
import {
  cleanNullableText,
  normalizeStatusLabel,
  normalizeTagList,
  toOptionalNumber,
} from "@/lib/employees/profile";
import { normaliseRole } from "@/lib/auth/profile";

const STAFF_TABLE_CANDIDATES = ["employees", "staff"] as const;

function revalidateStaffSettings(staffId: number) {
  revalidatePath(`/employees/${staffId}/settings`);
  revalidatePath(`/staff/${staffId}/settings`);
}

function isMissingTableError(error: PostgrestError | null): boolean {
  if (!error) return false;
  if (error.code === "42P01") return true;
  return /relation ["']?(employees|staff)["']? does not exist/i.test(error.message ?? "");
}

function isTruthyFlag(value: unknown): boolean {
  if (value === true) return true;
  if (value === false || value === null || value === undefined) return false;
  if (typeof value === "string") {
    const normalised = value.trim().toLowerCase();
    return ["true", "1", "yes", "y", "on"].includes(normalised);
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value !== 0 : false;
  }
  return false;
}

type StaffPermissionResult = "allowed" | "forbidden" | "unauthenticated";

async function viewerCanEditStaff(supabase: SupabaseClient): Promise<StaffPermissionResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "unauthenticated";

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = normaliseRole(profile?.role);
  if (role === "master" || role === "admin") {
    return "allowed";
  }

  const { data: employee } = await supabase
    .from("employees")
    .select("role, app_permissions")
    .eq("user_id", user.id)
    .maybeSingle();

  const employeeRole = typeof employee?.role === "string" ? employee.role.toLowerCase() : "";
  if (employeeRole.includes("manager") || employeeRole.includes("owner") || employeeRole.includes("admin")) {
    return "allowed";
  }

  const perms = employee?.app_permissions;
  if (perms && typeof perms === "object") {
    const flags = perms as Record<string, unknown>;
    if (
      isTruthyFlag(flags.can_manage_staff) ||
      isTruthyFlag(flags.can_edit_schedule) ||
      isTruthyFlag(flags.can_manage_discounts) ||
      isTruthyFlag(flags.can_view_reports) ||
      isTruthyFlag(flags.is_manager)
    ) {
      return "allowed";
    }
  }

  return "forbidden";
}

async function resolveStaffClient(): Promise<
  | { supabase: SupabaseClient; client: SupabaseClient; permission: "allowed" }
  | { supabase: SupabaseClient; client: null; permission: StaffPermissionResult }
> {
  const supabase = createClient();
  const permission = await viewerCanEditStaff(supabase);
  if (permission !== "allowed") {
    return { supabase, client: null, permission };
  }

  try {
    const admin = getSupabaseAdmin();
    return { supabase, client: admin, permission };
  } catch {
    return { supabase, client: supabase, permission };
  }
}

async function updateStaffRecord(client: SupabaseClient, staffId: number, payload: Record<string, unknown>) {
  let lastError: PostgrestError | null = null;
  for (const table of STAFF_TABLE_CANDIDATES) {
    const { error } = await client.from(table).update(payload).eq("id", staffId);
    if (!error) {
      return null;
    }
    lastError = error;
    if (!isMissingTableError(error)) {
      break;
    }
  }
  return lastError;
}

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
  const { client, permission } = await resolveStaffClient();
  if (!client) {
    const message =
      permission === "unauthenticated"
        ? "You must be signed in to update staff profiles"
        : "You do not have permission to update staff profiles";
    return { success: false, error: message };
  }
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
  const error = await updateStaffRecord(client, staffId, payload);
  if (error) {
    return { success: false, error: error.message };
  }
  revalidateStaffSettings(staffId);
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
  const { client, permission } = await resolveStaffClient();
  if (!client) {
    const message =
      permission === "unauthenticated"
        ? "You must be signed in to update staff compensation"
        : "You do not have permission to update staff compensation";
    return { success: false, error: message };
  }
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
  const error = await updateStaffRecord(client, staffId, payload);
  if (error) {
    return { success: false, error: error.message };
  }
  revalidateStaffSettings(staffId);
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
  const { client, permission } = await resolveStaffClient();
  if (!client) {
    const message =
      permission === "unauthenticated"
        ? "You must be signed in to update staff preferences"
        : "You do not have permission to update staff preferences";
    return { success: false, error: message };
  }
  const preferredBreeds = normalizeTagList(input.preferred_breeds);
  const notAcceptedBreeds = normalizeTagList(input.not_accepted_breeds);
  const specialties = normalizeTagList(input.specialties);
  const weeklyTarget = toOptionalNumber(input.weeklyTarget);
  const dogsPerDay = toOptionalNumber(input.dogsPerDay);

  const employeeError = await updateStaffRecord(client, staffId, {
    preferred_breeds: preferredBreeds,
    not_accepted_breeds: notAcceptedBreeds,
    specialties,
  });

  const { error: goalsError } = await client
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
    return {
      success: false,
      error: employeeError?.message ?? goalsError?.message ?? "Unable to save preferences",
    };
  }
  revalidateStaffSettings(staffId);
  return { success: true };
}

export async function saveManagerNotesAction(staffId: number, notes: string) {
  const { client, permission } = await resolveStaffClient();
  if (!client) {
    const message =
      permission === "unauthenticated"
        ? "You must be signed in to update manager notes"
        : "You do not have permission to update manager notes";
    return { success: false, error: message };
  }
  const error = await updateStaffRecord(client, staffId, {
    manager_notes: notes?.trim() ? notes : null,
  });
  if (error) {
    return { success: false, error: error.message };
  }
  revalidateStaffSettings(staffId);
  return { success: true };
}
