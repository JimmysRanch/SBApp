import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { z } from "zod";

import { enqueueAudit, getTokensForUser, sendWebPush } from "@/lib/notifications";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const bodySchema = z.object({
  appointmentId: z.string().uuid("appointmentId must be a valid UUID"),
});

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Invalid request body";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data: appointment, error: appointmentError } = await admin
    .from("appointments")
    .select("id, client_id")
    .eq("id", body.appointmentId)
    .maybeSingle();

  if (appointmentError) {
    return NextResponse.json(
      { error: appointmentError.message ?? "Failed to load appointment" },
      { status: 500 },
    );
  }

  if (!appointment) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }

  const clientId = appointment.client_id;
  if (!clientId) {
    return NextResponse.json(
      { error: "Appointment does not have an associated client" },
      { status: 400 },
    );
  }

  try {
    await enqueueAudit({
      actor: session.user.id,
      action: "appointment_reminder_queued",
      entity: "appointments",
      entityId: body.appointmentId,
    });

    const tokens = await getTokensForUser(clientId);
    const delivered = await sendWebPush(tokens, {
      type: "appointment-reminder",
      appointmentId: body.appointmentId,
    });

    return NextResponse.json({ delivered, tokens: tokens.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to send reminder";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
