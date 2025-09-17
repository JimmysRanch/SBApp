"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";

function toIsoString(value: FormDataEntryValue | null) {
  return value ? new Date(String(value)).toISOString() : null;
}

export async function addShift(formData: FormData) {
  const supabase = createServerClient();
  const employeeId = Number(formData.get("employee_id"));

  await supabase.from("staff_shifts").insert({
    employee_id: employeeId,
    starts_at: toIsoString(formData.get("starts_at")),
    ends_at: toIsoString(formData.get("ends_at")),
    note: String(formData.get("note") ?? ""),
  });

  revalidatePath(`/employees/${employeeId}/schedule`);
}

export async function deleteShift(formData: FormData) {
  const supabase = createServerClient();
  const id = Number(formData.get("id"));

  const { data } = await supabase
    .from("staff_shifts")
    .select("employee_id")
    .eq("id", id)
    .maybeSingle();

  await supabase.from("staff_shifts").delete().eq("id", id);

  if (data?.employee_id) {
    revalidatePath(`/employees/${data.employee_id}/schedule`);
  }
}

export async function requestTimeOff(formData: FormData) {
  const supabase = createServerClient();
  const employeeId = Number(formData.get("employee_id"));

  await supabase.from("staff_time_off").insert({
    employee_id: employeeId,
    starts_at: toIsoString(formData.get("starts_at")),
    ends_at: toIsoString(formData.get("ends_at")),
    reason: String(formData.get("reason") ?? ""),
  });

  revalidatePath(`/employees/${employeeId}/schedule`);
}

export async function setTimeOffStatus(formData: FormData) {
  const supabase = createServerClient();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status"));

  const { data } = await supabase
    .from("staff_time_off")
    .select("employee_id")
    .eq("id", id)
    .maybeSingle();

  await supabase.from("staff_time_off").update({ status }).eq("id", id);

  if (data?.employee_id) {
    revalidatePath(`/employees/${data.employee_id}/schedule`);
  }
}
