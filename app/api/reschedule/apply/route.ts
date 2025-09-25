import { NextResponse } from "next/server";
import { z } from "zod";
import { applyReschedule } from "@/server/scheduling";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const payloadSchema = z.object({
  token: z.string().min(10, "Missing reschedule token"),
  starts_at: z.string(),
  staff_id: z.string().uuid().optional(),
  service_id: z.string().uuid().optional(),
});

function parseStart(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid start time provided");
  }
  return date;
}

async function resolveServiceId(token: string): Promise<{ serviceId: string; staffId: string | null } | null> {
  const admin = getSupabaseAdmin();
  const { data: linkRow, error: linkError } = await admin
    .from("reschedule_links")
    .select("appointment_id")
    .eq("token", token)
    .maybeSingle();
  if (linkError) throw linkError;
  const link = linkRow as { appointment_id: string } | null;
  if (!link) {
    return null;
  }
  const { data: appointmentRow, error: appointmentError } = await admin
    .from("appointments")
    .select("service_id, staff_id")
    .eq("id", link.appointment_id)
    .maybeSingle();
  if (appointmentError) throw appointmentError;
  const appointment = appointmentRow as { service_id: string | null; staff_id: string | null } | null;
  if (!appointment?.service_id) {
    return null;
  }
  return { serviceId: appointment.service_id, staffId: appointment.staff_id ?? null };
}

function normaliseErrorStatus(message: string) {
  if (/not found|missing|expired|already been used|available/i.test(message)) {
    return 400;
  }
  return 500;
}

export async function POST(request: Request) {
  try {
    const raw = await request.json();
    const payload = payloadSchema.parse(raw);
    const startsAt = parseStart(payload.starts_at);

    let serviceId = payload.service_id;
    let defaultStaffId: string | null = null;

    if (!serviceId) {
      const resolved = await resolveServiceId(payload.token);
      if (!resolved) {
        return NextResponse.json(
          { error: "Reschedule link could not be located." },
          { status: 404 },
        );
      }
      serviceId = resolved.serviceId;
      defaultStaffId = resolved.staffId;
    }

    const result = await applyReschedule({
      token: payload.token,
      newSlot: {
        serviceId,
        staffId: payload.staff_id ?? defaultStaffId ?? undefined,
        startsAt,
      },
    });

    return NextResponse.json({ appointment: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const first = error.issues[0];
      return NextResponse.json(
        { error: first?.message ?? "Invalid request" },
        { status: 400 },
      );
    }
    console.error("Failed to apply reschedule", error);
    const message = error instanceof Error ? error.message : "Unable to reschedule appointment.";
    return NextResponse.json(
      { error: message },
      { status: normaliseErrorStatus(message) },
    );
  }
}
