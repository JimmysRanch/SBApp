import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, getSupabaseAdmin } from "@/lib/supabase/server";
import { listSlots } from "@/server/scheduling";
import type { AvailableSlot } from "@/server/scheduling";
import RescheduleForm from "./RescheduleForm";
import type { RescheduleReadyContext, SlotOption } from "./types";

const appointmentFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "full",
  timeStyle: "short",
});

type SearchParams = {
  t?: string | string[];
};

type RescheduleContext = { status: "error"; message: string } | RescheduleReadyContext;

const SLOT_WINDOW_DAYS = 30;

function normaliseToken(raw: string | string[] | undefined): string | null {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw;
}

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= Date.now();
}

async function resolveStaffNames(ids: string[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("profiles")
    .select("id, full_name")
    .in("id", ids);
  if (error) throw error;
  const rows = (data as { id: string; full_name: string | null }[] | null) ?? [];
  const map = new Map<string, string>();
  for (const row of rows) {
    map.set(row.id, row.full_name?.trim() || "Team Member");
  }
  return map;
}

async function loadRescheduleContext(token: string, userId: string): Promise<RescheduleContext> {
  try {
    const admin = getSupabaseAdmin();
    const { data: linkRow, error: linkError } = await admin
      .from("reschedule_links")
      .select("id, appointment_id, token, expires_at, used_at")
      .eq("token", token)
      .maybeSingle();

    if (linkError) throw linkError;

    const link = linkRow as
      | {
          id: string;
          appointment_id: string;
          token: string;
          expires_at: string | null;
          used_at: string | null;
        }
      | null;

    if (!link || link.used_at || isExpired(link.expires_at)) {
      return {
        status: "error",
        message: "This reschedule link is no longer valid. Please request a new one from our team.",
      };
    }

    const { data: appointmentRow, error: appointmentError } = await admin
      .from("appointments")
      .select("id, client_id, service_id, staff_id, starts_at, ends_at")
      .eq("id", link.appointment_id)
      .maybeSingle();

    if (appointmentError) throw appointmentError;

    const appointment = appointmentRow as
      | {
          id: string;
          client_id: string | null;
          service_id: string | null;
          staff_id: string | null;
          starts_at: string;
          ends_at: string;
        }
      | null;

    if (!appointment || appointment.client_id !== userId) {
      return {
        status: "error",
        message: "We couldn't find an appointment that matches this reschedule request.",
      };
    }

    if (!appointment.service_id) {
      return {
        status: "error",
        message: "This appointment is missing its service details and can't be rescheduled online.",
      };
    }

    const { data: serviceRow, error: serviceError } = await admin
      .from("services")
      .select("id, name")
      .eq("id", appointment.service_id)
      .maybeSingle();
    if (serviceError) throw serviceError;
    const service = serviceRow as { id: string; name: string | null } | null;

    const now = new Date();
    const from = now;
    const to = new Date(now.getTime() + SLOT_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    let slots: AvailableSlot[] = [];
    try {
      slots = await listSlots({
        serviceId: appointment.service_id,
        from,
        to,
      });
    } catch (slotError) {
      console.error("Failed to load reschedule slots", slotError);
      slots = [];
    }

    const futureSlots = slots
      .filter((slot) => slot.start.getTime() > now.getTime())
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    const staffIds = new Set<string>();
    if (appointment.staff_id) {
      staffIds.add(appointment.staff_id);
    }
    for (const slot of futureSlots) {
      staffIds.add(slot.staffId);
    }

    const staffMap = await resolveStaffNames([...staffIds]);

    const slotOptions: SlotOption[] = futureSlots.slice(0, 60).map((slot) => ({
      id: `${slot.staffId}-${slot.start.toISOString()}`,
      staffId: slot.staffId,
      staffName: staffMap.get(slot.staffId) ?? "Team Member",
      startIso: slot.start.toISOString(),
      endIso: slot.end.toISOString(),
    }));

    return {
      status: "ready",
      token,
      appointment: {
        id: appointment.id,
        serviceId: appointment.service_id,
        serviceName: service?.name ?? null,
        startsAtIso: appointment.starts_at,
        staffId: appointment.staff_id,
        staffName: appointment.staff_id ? staffMap.get(appointment.staff_id) ?? "Team Member" : null,
      },
      slots: slotOptions,
    };
  } catch (error) {
    console.error("Failed to prepare reschedule context", error);
    return {
      status: "error",
      message: "We couldn't load this reschedule request. Please try again later.",
    };
  }
}

export default async function ClientReschedulePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const token = normaliseToken(searchParams.t);
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const redirectTo = token ? `/client/reschedule?t=${encodeURIComponent(token)}` : "/client";
    redirect(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-semibold text-white">Reschedule appointment</h1>
        <div className="mt-6 rounded-2xl border border-red-500/40 bg-red-500/10 px-6 py-5 text-sm text-red-100">
          We couldn't find that reschedule request. Please return to the client portal and try again.
        </div>
        <Link
          href="/client"
          className="mt-6 inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-navy transition hover:bg-white/90"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  const context = await loadRescheduleContext(token, session!.user.id);

  if (context.status === "error") {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-semibold text-white">Reschedule appointment</h1>
        <div className="mt-6 rounded-2xl border border-red-500/40 bg-red-500/10 px-6 py-5 text-sm text-red-100">
          {context.message}
        </div>
        <Link
          href="/client"
          className="mt-6 inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-navy transition hover:bg-white/90"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 text-white">
      <h1 className="text-3xl font-semibold">Reschedule appointment</h1>
      <p className="mt-2 text-sm text-white/80">
        Currently booked for {appointmentFormatter.format(new Date(context.appointment.startsAtIso))}
        {context.appointment.staffName ? ` with ${context.appointment.staffName}` : ""}.
      </p>
      <RescheduleForm context={context} />
    </div>
  );
}
