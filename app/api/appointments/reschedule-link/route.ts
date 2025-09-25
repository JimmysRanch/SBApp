import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { z } from "zod";

import { createRescheduleLink } from "../../../../src/server/scheduling";

export const runtime = "nodejs";

const payloadSchema = z.object({
  appointmentId: z.string().uuid(),
});

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const link = await createRescheduleLink({
      appointmentId: parsed.data.appointmentId,
      createdBy: session.user.id,
    });

    return NextResponse.json({ data: link });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create reschedule link";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
