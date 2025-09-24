import clsx from "clsx";
import { createClient } from "@/lib/supabase/server";

type AppointmentRow = {
  id: string;
  scheduled_time: string | null;
  pet_name: string | null;
  client_name: string | null;
  status: string | null;
};

const statusStyles: Record<string, string> = {
  Completed: "bg-brand-mint/30 text-brand-navy",
  Upcoming: "bg-white/40 text-brand-navy",
  Cancelled: "bg-brand-bubble/40 text-white",
  "In Progress": "bg-brand-sunshine/60 text-brand-navy",
  "Checked In": "bg-brand-lavender/40 text-white",
};

function formatAppointment(row: AppointmentRow) {
  const timeValue = row.scheduled_time ? new Date(row.scheduled_time) : null;
  return {
    id: row.id,
    time: timeValue
      ? timeValue.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      : "",
    petName: row.pet_name ?? "Unknown pet",
    clientName: row.client_name ?? "Unknown client",
    status: row.status ?? "Upcoming",
  };
}

export default async function TodaysAppointments() {
  const supabase = createClient();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from("appointments")
    .select("id, scheduled_time, pet_name, client_name, status")
    .gte("scheduled_time", start.toISOString())
    .lte("scheduled_time", end.toISOString())
    .order("scheduled_time", { ascending: true });

  if (error) {
    console.error("Failed to load today's appointments", error);
    return (
      <div className="rounded-3xl border border-red-200/40 bg-red-100/30 p-6 text-sm text-red-700 backdrop-blur-md">
        Failed to load today&rsquo;s appointments.
      </div>
    );
  }

  const appointments = (data ?? []).map(formatAppointment).filter((appt) => appt.time);

  if (appointments.length === 0) {
    return (
      <div className="rounded-3xl border border-white/30 bg-white/10 p-6 text-white/80 backdrop-blur-md">
        No appointments today.
      </div>
    );
  }

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-white">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-white/70">Today</p>
          <h3 className="text-2xl font-semibold tracking-tight drop-shadow-sm">{todayLabel}</h3>
        </div>
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/25 text-lg font-semibold text-white shadow-inner">
          {appointments.length}
        </span>
      </div>
      <ul className="space-y-3">
        {appointments.map((appt) => (
          <li
            key={appt.id}
            className="grid grid-cols-[auto,1fr,auto] items-center gap-4 rounded-3xl bg-white/95 px-5 py-4 text-brand-navy shadow-lg shadow-primary/10 backdrop-blur"
          >
            <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-bubble/20 text-2xl">
              🐶
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-navy">{appt.petName}</p>
              <p className="text-xs text-brand-navy/70">{appt.clientName}</p>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-brand-navy">{appt.time}</div>
              <span
                className={clsx(
                  "mt-2 inline-flex items-center justify-center rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide",
                  statusStyles[appt.status] ?? "bg-white/40 text-brand-navy",
                )}
              >
                {appt.status}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
