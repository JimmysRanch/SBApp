"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/supabase/server";

export async function addShiftAction(
  staffId: number,
  input: { start: string; end: string; note?: string }
) {
  const supabase = createClient();
  if (!input.start || !input.end) {
    return { success: false, error: "Start and end time required" };
  }
  const payload = {
    employee_id: staffId,
    starts_at: new Date(input.start).toISOString(),
    ends_at: new Date(input.end).toISOString(),
    note: input.note?.trim() ? input.note : null,
  };
  const { error } = await supabase.from("staff_shifts").insert(payload);
  if (error) {
    return { success: false, error: error.message };
  }
  revalidatePath(`/employees/${staffId}/schedule`);
  return { success: true };
}

export async function deleteShiftAction(staffId: number, shiftId: number) {
  const supabase = createClient();
  const { error } = await supabase.from("staff_shifts").delete().eq("id", shiftId);
  if (error) {
    return { success: false, error: error.message };
  }
  revalidatePath(`/employees/${staffId}/schedule`);
  return { success: true };
}

export async function requestTimeOffAction(
  staffId: number,
  input: { start: string; end: string; reason: string }
) {
  if (!input.start || !input.end || !input.reason.trim()) {
    return { success: false, error: "All fields are required" };
  }
  const supabase = createClient();
  const payload = {
    employee_id: staffId,
    starts_at: new Date(input.start).toISOString(),
    ends_at: new Date(input.end).toISOString(),
    reason: input.reason.trim(),
    status: "pending",
  };
  const { error } = await supabase.from("staff_time_off").insert(payload);
  if (error) {
    return { success: false, error: error.message };
  }
  revalidatePath(`/employees/${staffId}/schedule`);
  return { success: true };
}

export async function updateTimeOffStatusAction(
  staffId: number,
  requestId: number,
  status: "approved" | "denied"
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("staff_time_off")
    .update({ status })
    .eq("id", requestId);
  if (error) {
    return { success: false, error: error.message };
  }
  revalidatePath(`/employees/${staffId}/schedule`);
  return { success: true };
}
