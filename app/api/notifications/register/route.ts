import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { z } from "zod";
import { registerNotificationToken } from "@/src/server/scheduling";

export const runtime = "nodejs";

const bodySchema = z.object({
  token: z.string().min(1, "Token is required"),
  platform: z.literal("web"),
});

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = bodySchema.parse(body);
    await registerNotificationToken({
      userId: session.user.id,
      token: parsed.token,
      platform: parsed.platform,
    });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Invalid body";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
