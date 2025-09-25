import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, getSupabaseAdmin } from "@/lib/supabase/server";

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "full",
  timeStyle: "short",
});

interface AppointmentSummary {
  id: string;
  startsAt: string;
  endsAt: string;
  serviceName: string | null;
  staffName: string | null;
  rescheduleToken: string | null;
}

async function loadNextAppointment(userId: string): Promise<AppointmentSummary | null> {
  const admin = getSupabaseAdmin();
  const nowIso = new Date().toISOString();

  const { data: appointmentRow, error: appointmentError } = await admin
    .from("appointments")
    .select("id, starts_at, ends_at, service_id, staff_id")
    .eq("client_id", userId)
    .gte("starts_at", nowIso)
    .order("starts_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (appointmentError) throw appointmentError;

  const appointment = appointmentRow as
    | {
        id: string;
        starts_at: string;
        ends_at: string;
        service_id: string | null;
        staff_id: string | null;
      }
    | null;

  if (!appointment) {
    return null;
  }

  let serviceName: string | null = null;
  if (appointment.service_id) {
    const { data: serviceRow, error: serviceError } = await admin
      .from("services")
      .select("name")
      .eq("id", appointment.service_id)
      .maybeSingle();
    if (serviceError) throw serviceError;
    const service = serviceRow as { name: string | null } | null;
    serviceName = service?.name ?? null;
  }

  let staffName: string | null = null;
  if (appointment.staff_id) {
    const { data: staffRow, error: staffError } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", appointment.staff_id)
      .maybeSingle();
    if (staffError) throw staffError;
    const staff = staffRow as { full_name: string | null } | null;
    staffName = staff?.full_name ?? null;
  }

  const { data: linkRow, error: linkError } = await admin
    .from("reschedule_links")
    .select("token, expires_at, used_at")
    .eq("appointment_id", appointment.id)
    .order("expires_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (linkError) throw linkError;

  const link = linkRow as { token: string; expires_at: string | null; used_at: string | null } | null;
  let rescheduleToken: string | null = null;
  if (link && !link.used_at) {
    if (!link.expires_at || new Date(link.expires_at).getTime() > Date.now()) {
      rescheduleToken = link.token;
    }
  }

  return {
    id: appointment.id,
    startsAt: appointment.starts_at,
    endsAt: appointment.ends_at,
    serviceName,
    staffName,
    rescheduleToken,
  };
}

function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}

export default async function ClientHome() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  let upcoming: AppointmentSummary | null = null;
  let loadError: string | null = null;

  try {
    upcoming = await loadNextAppointment(session.user.id);
  } catch (error) {
    console.error("Failed to load next appointment", error);
    loadError = "We couldn't load your upcoming appointment just now.";
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
      <h1 className="text-3xl font-semibold text-white">Welcome back!</h1>
      <p className="text-sm text-white/80">
        From here you can review your upcoming grooming appointments or update your personal details.
      </p>

      {loadError ? (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-6 py-5 text-sm text-red-100">
          {loadError}
        </div>
      ) : upcoming ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-white">
          <h2 className="text-lg font-semibold">Next appointment</h2>
          <p className="mt-2 text-sm text-white/80">{formatDateTime(upcoming.startsAt)}</p>
          {upcoming.serviceName && (
            <p className="mt-1 text-sm text-white/70">Service: {upcoming.serviceName}</p>
          )}
          {upcoming.staffName && (
            <p className="mt-1 text-sm text-white/70">With: {upcoming.staffName}</p>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/client/appointments"
              className="inline-flex items-center rounded-full border border-white/20 px-4 py-2 text-sm font-semibold transition hover:border-white/40 hover:bg-white/10"
            >
              View details
            </Link>
            {upcoming.rescheduleToken && (
              <Link
                href={`/client/reschedule?t=${encodeURIComponent(upcoming.rescheduleToken)}`}
                className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-navy transition hover:bg-white/90"
              >
                Reschedule
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-white/80">
          <h2 className="text-lg font-semibold text-white">No upcoming appointments</h2>
          <p className="mt-2 text-sm">
            When you book your next visit it will appear here. Need to make one now?
          </p>
          <Link
            href="/book"
            className="mt-4 inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-navy transition hover:bg-white/90"
          >
            Book an appointment
          </Link>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/client/appointments"
          className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 transition hover:border-white/30 hover:bg-white/10"
        >
          <h2 className="text-lg font-semibold text-white">My Appointments</h2>
          <p className="text-sm text-white/70">View upcoming visits and check past services.</p>
        </Link>
        <Link
          href="/client/profile"
          className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 transition hover:border-white/30 hover:bg-white/10"
        >
          <h2 className="text-lg font-semibold text-white">Profile</h2>
          <p className="text-sm text-white/70">Keep your contact information current.</p>
        </Link>
      </div>
    </div>
  );
}
