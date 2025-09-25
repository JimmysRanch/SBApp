"use client";

import { supabase } from "@/lib/supabase/client";

export type AuditLogAction =
  | "appointment_reminder_queued"
  | "appointment_pickup_ready"
  | "appointment_reschedule_link_created";

type AuditLogRow = {
  created_at: string | null;
};

export async function fetchLatestAuditTimestamp(
  appointmentId: string,
  action: AuditLogAction
): Promise<Date | null> {
  const { data, error } = await supabase
    .from("audit_log")
    .select("created_at")
    .eq("entity", "appointments")
    .eq("entity_id", appointmentId)
    .eq("action", action)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message ?? "Failed to load audit log");
  }

  const row = data as AuditLogRow | null;
  if (!row || !row.created_at) {
    return null;
  }

  return new Date(row.created_at);
}
