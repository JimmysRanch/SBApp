"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";

import { useAuth } from "@/components/AuthProvider";
import AppointmentDetailDrawer, {
  type AppointmentDraft,
  type DrawerAddOnOption,
  type DrawerServiceOption,
  type DrawerStaffOption,
} from "@/components/scheduling/AppointmentDetailDrawer";
import { canAccessRoute, isGroomerRole } from "@/lib/auth/access";
import { toLegacyRole } from "@/lib/auth/roles";
import { useSchedulingCatalog } from "@/hooks/useSchedulingCatalog";

const STEP_MINUTES = 15;
const DAY_START_MINUTES = 7 * 60;
const DAY_END_MINUTES = 19 * 60;
const HOUR_HEIGHT = 64;
const MINUTE_HEIGHT = HOUR_HEIGHT / 60;
const COLUMN_HEIGHT = (DAY_END_MINUTES - DAY_START_MINUTES) * MINUTE_HEIGHT;

type StaffMember = DrawerStaffOption & {
  initials: string;
  profileId: string;
  colorClass: string;
};

type Appointment = {
  id: string;
  date: string; // yyyy-mm-dd
  staffId: string;
  serviceId: string;
  sizeId: string;
  startMinutes: number;
  endMinutes: number;
  clientName: string;
  petName: string;
  addOnIds: string[];
  discount: number;
  tax: number;
  status: AppointmentDraft["status"];
  notes?: string;
};

type Interaction =
  | {
      type: "create";
      pointerId: number;
      staffId: string;
      date: string;
      startMinutes: number;
      endMinutes: number;
    }
  | {
      type: "move";
      pointerId: number;
      appointmentId: string;
      staffId: string;
      date: string;
      offsetMinutes: number;
      durationMinutes: number;
    }
  | {
      type: "resize-start";
      pointerId: number;
      appointmentId: string;
      staffId: string;
      date: string;
      originalEnd: number;
    }
  | {
      type: "resize-end";
      pointerId: number;
      appointmentId: string;
      staffId: string;
      date: string;
      originalStart: number;
    };

function addDays(base: Date, amount: number) {
  const next = new Date(base);
  next.setDate(next.getDate() + amount);
  return next;
}

function startOfWeek(date: Date) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function snapMinutes(value: number) {
  return Math.round(value / STEP_MINUTES) * STEP_MINUTES;
}

function minutesToOffset(minutes: number) {
  return (minutes - DAY_START_MINUTES) * MINUTE_HEIGHT;
}

function durationToHeight(minutes: number) {
  return minutes * MINUTE_HEIGHT;
}

function formatTime(minutes: number) {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const suffix = hrs >= 12 ? "PM" : "AM";
  const displayHour = ((hrs + 11) % 12) + 1;
  return `${displayHour}:${String(mins).padStart(2, "0")} ${suffix}`;
}

export default function CalendarPage() {
  const { loading, role, profile } = useAuth();
  const legacyRole = useMemo(() => toLegacyRole(role), [role]);
  const {
    staff: staffCatalog,
    services: serviceDefinitions,
    addOns: addOnDefinitions,
    loading: catalogLoading,
    error: catalogError,
  } = useSchedulingCatalog();

  const staffDirectory = useMemo<StaffMember[]>(
    () =>
      staffCatalog.map((staff) => ({
        id: staff.id,
        name: staff.name,
        initials: staff.initials,
        profileId: staff.id,
        colorClass: staff.colorClass,
      })),
    [staffCatalog]
  );

  const serviceCatalog = useMemo<DrawerServiceOption[]>(
    () =>
      serviceDefinitions.map((service) => ({
        id: service.id,
        name: service.name,
        basePrice: service.basePrice,
        sizes: service.sizes,
        color: service.colorClass,
      })),
    [serviceDefinitions]
  );

  const addOnCatalog = useMemo<DrawerAddOnOption[]>(
    () => addOnDefinitions.map((addOn) => ({ id: addOn.id, name: addOn.name, price: addOn.price })),
    [addOnDefinitions]
  );

  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);
  const todayKey = useMemo(() => formatDateKey(today), [today]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(today);
  const [view, setView] = useState<"day" | "week">("day");
  const [interaction, setInteraction] = useState<Interaction | null>(null);
  const interactionRef = useRef<Interaction | null>(null);
  const originalAppointment = useRef<Appointment | null>(null);
  const columnRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [drawerState, setDrawerState] = useState<{ open: boolean; appointmentId: string | null }>({
    open: false,
    appointmentId: null,
  });

  useEffect(() => {
    interactionRef.current = interaction;
  }, [interaction, serviceCatalog]);

  useEffect(() => {
    function handleMove(event: PointerEvent) {
      const current = interactionRef.current;
      if (!current) return;

      if (current.type === "create") {
        const column = columnRefs.current[current.staffId];
        const minute = toMinutesFromPointer(event, column);
        const clamped = clamp(snapMinutes(minute), DAY_START_MINUTES, DAY_END_MINUTES);
        setInteraction({ ...current, endMinutes: clamped });
        return;
      }

      if (current.type === "move") {
        const nextStaffId = staffIdFromPointer(event.clientX) ?? current.staffId;
        const column = columnRefs.current[nextStaffId] ?? columnRefs.current[current.staffId];
        const pointerMinutes = toMinutesFromPointer(event, column);
        const rawStart = pointerMinutes - current.offsetMinutes;
        const snappedStart = clamp(
          snapMinutes(rawStart),
          DAY_START_MINUTES,
          DAY_END_MINUTES - current.durationMinutes
        );
        const nextEnd = snappedStart + current.durationMinutes;

        setInteraction({ ...current, staffId: nextStaffId });
        setAppointments((prev) =>
          prev.map((appointment) =>
            appointment.id === current.appointmentId
              ? {
                  ...appointment,
                  staffId: nextStaffId,
                  startMinutes: snappedStart,
                  endMinutes: nextEnd,
                }
              : appointment
          )
        );
        return;
      }

      if (current.type === "resize-start") {
        const column = columnRefs.current[current.staffId];
        const pointerMinutes = toMinutesFromPointer(event, column);
        const upperBound = clamp(current.originalEnd - STEP_MINUTES, DAY_START_MINUTES, DAY_END_MINUTES);
        const nextStart = clamp(snapMinutes(pointerMinutes), DAY_START_MINUTES, upperBound);
        setAppointments((prev) =>
          prev.map((appointment) =>
            appointment.id === current.appointmentId
              ? { ...appointment, startMinutes: nextStart }
              : appointment
          )
        );
        return;
      }

      if (current.type === "resize-end") {
        const column = columnRefs.current[current.staffId];
        const pointerMinutes = toMinutesFromPointer(event, column);
        const lowerBound = clamp(current.originalStart + STEP_MINUTES, DAY_START_MINUTES, DAY_END_MINUTES);
        const nextEnd = clamp(snapMinutes(pointerMinutes), lowerBound, DAY_END_MINUTES);
        setAppointments((prev) =>
          prev.map((appointment) =>
            appointment.id === current.appointmentId
              ? { ...appointment, endMinutes: nextEnd }
              : appointment
          )
        );
      }
    }

    function handleUp(event: PointerEvent) {
      const current = interactionRef.current;
      if (!current || current.pointerId !== event.pointerId) return;

      if (current.type === "create") {
        const start = Math.min(current.startMinutes, current.endMinutes);
        const end = Math.max(current.startMinutes, current.endMinutes);
        const safeStart = clamp(snapMinutes(start), DAY_START_MINUTES, DAY_END_MINUTES - STEP_MINUTES);
        const safeEnd = clamp(snapMinutes(end), safeStart + STEP_MINUTES, DAY_END_MINUTES);

        if (serviceCatalog.length === 0) {
          cleanupInteraction();
          return;
        }

        const defaultService = serviceCatalog[0];
        const defaultSize = defaultService.sizes[0] ?? {
          id: `${defaultService.id}-standard`,
          label: "Standard",
          multiplier: 1,
        };
        const id = `apt-${Date.now()}`;
        const fresh: Appointment = {
          id,
          date: current.date,
          staffId: current.staffId,
          serviceId: defaultService.id,
          sizeId: defaultSize.id,
          startMinutes: safeStart,
          endMinutes: safeEnd,
          clientName: "Walk-in client",
          petName: "New pet",
          addOnIds: [],
          discount: 0,
          tax: 0,
          status: "booked",
        };
        setAppointments((prev) => [...prev, fresh]);
        setDrawerState({ open: true, appointmentId: id });
      }

      cleanupInteraction();
    }

    function handleCancel() {
      const current = interactionRef.current;
      if (!current) return;
      if (current.type === "move" || current.type === "resize-start" || current.type === "resize-end") {
        const original = originalAppointment.current;
        if (original) {
          setAppointments((prev) =>
            prev.map((appointment) => (appointment.id === original.id ? original : appointment))
          );
        }
      }
      cleanupInteraction();
    }

    function cleanupInteraction() {
      setInteraction(null);
      interactionRef.current = null;
      originalAppointment.current = null;
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleCancel);
    }

    if (interaction) {
      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp);
      window.addEventListener("pointercancel", handleCancel);
    }

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleCancel);
    };
  }, [interaction, serviceCatalog]);

  function staffIdFromPointer(clientX: number) {
    const entries = Object.entries(columnRefs.current);
    for (const [staffId, node] of entries) {
      if (!node) continue;
      const rect = node.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right) {
        return staffId;
      }
    }
    return null;
  }

  function toMinutesFromPointer(event: PointerEvent | ReactPointerEvent, column: HTMLElement | null) {
    if (!column) {
      return DAY_START_MINUTES;
    }
    const rect = column.getBoundingClientRect();
    const offset = clamp(event.clientY - rect.top, 0, rect.height);
    const minutes = offset / MINUTE_HEIGHT + DAY_START_MINUTES;
    return clamp(minutes, DAY_START_MINUTES, DAY_END_MINUTES);
  }

  function beginCreate(staffId: string, date: string, event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    if ((event.target as HTMLElement).closest("[data-appointment-id]")) return;

    const column = columnRefs.current[staffId];
    const start = toMinutesFromPointer(event.nativeEvent, column);
    const snappedStart = clamp(snapMinutes(start), DAY_START_MINUTES, DAY_END_MINUTES - STEP_MINUTES);

    const draft: Interaction = {
      type: "create",
      pointerId: event.pointerId,
      staffId,
      date,
      startMinutes: snappedStart,
      endMinutes: snappedStart + STEP_MINUTES,
    };
    setInteraction(draft);
    interactionRef.current = draft;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function beginMove(appointment: Appointment, event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    if ((event.target as HTMLElement).dataset.role === "resize-handle") return;
    event.stopPropagation();

    const column = columnRefs.current[appointment.staffId];
    const pointerMinutes = toMinutesFromPointer(event.nativeEvent, column);
    const offset = pointerMinutes - appointment.startMinutes;

    const draft: Interaction = {
      type: "move",
      pointerId: event.pointerId,
      appointmentId: appointment.id,
      staffId: appointment.staffId,
      date: appointment.date,
      offsetMinutes: offset,
      durationMinutes: appointment.endMinutes - appointment.startMinutes,
    };
    originalAppointment.current = { ...appointment };
    interactionRef.current = draft;
    setInteraction(draft);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function beginResize(
    appointment: Appointment,
    role: "start" | "end",
    event: ReactPointerEvent<HTMLDivElement>
  ) {
    if (event.button !== 0) return;
    event.stopPropagation();

    const draft: Interaction =
      role === "start"
        ? {
            type: "resize-start",
            pointerId: event.pointerId,
            appointmentId: appointment.id,
            staffId: appointment.staffId,
            date: appointment.date,
            originalEnd: appointment.endMinutes,
          }
        : {
            type: "resize-end",
            pointerId: event.pointerId,
            appointmentId: appointment.id,
            staffId: appointment.staffId,
            date: appointment.date,
            originalStart: appointment.startMinutes,
          };

    originalAppointment.current = { ...appointment };
    interactionRef.current = draft;
    setInteraction(draft);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleViewChange(next: "day" | "week") {
    setView(next);
  }

  function goToToday() {
    setCurrentDate(today);
  }

  function goPrevious() {
    setCurrentDate((prev) => (view === "day" ? addDays(prev, -1) : addDays(prev, -7)));
  }

  function goNext() {
    setCurrentDate((prev) => (view === "day" ? addDays(prev, 1) : addDays(prev, 7)));
  }

  function openDrawer(appointmentId: string) {
    setDrawerState({ open: true, appointmentId });
  }

  function closeDrawer() {
    setDrawerState((prev) => ({ ...prev, open: false }));
  }

  function handleDrawerSubmit(draft: AppointmentDraft) {
    setAppointments((prev) =>
      prev.map((appointment) =>
        appointment.id === draft.id
          ? {
              ...appointment,
              staffId: draft.staffId,
              serviceId: draft.serviceId,
              sizeId: draft.sizeId,
              addOnIds: draft.addOnIds,
              discount: draft.discount,
              tax: draft.tax,
              status: draft.status,
              notes: draft.notes,
            }
          : appointment
      )
    );
    closeDrawer();
  }

  function handleDrawerDelete(id: string) {
    setAppointments((prev) => prev.filter((appointment) => appointment.id !== id));
    closeDrawer();
  }

  const appointmentForDrawer = useMemo(() => {
    if (!drawerState.appointmentId) return null;
    return appointments.find((appointment) => appointment.id === drawerState.appointmentId) ?? null;
  }, [appointments, drawerState.appointmentId]);

  const drawerValue = useMemo<AppointmentDraft | null>(() => {
    if (!appointmentForDrawer) return null;
    return {
      id: appointmentForDrawer.id,
      staffId: appointmentForDrawer.staffId,
      serviceId: appointmentForDrawer.serviceId,
      sizeId: appointmentForDrawer.sizeId,
      addOnIds: appointmentForDrawer.addOnIds,
      discount: appointmentForDrawer.discount,
      tax: appointmentForDrawer.tax,
      status: appointmentForDrawer.status,
      notes: appointmentForDrawer.notes,
    };
  }, [appointmentForDrawer]);

  const staffForViewer = useMemo(() => {
    if (staffDirectory.length === 0) return [];
    if (!legacyRole) return staffDirectory;
    if (!isGroomerRole(legacyRole)) return staffDirectory;
    const viewerId = profile?.id;
    if (viewerId) {
      const match = staffDirectory.find((staff) => staff.profileId === viewerId);
      if (match) return [match];
    }
    return [staffDirectory[0]];
  }, [legacyRole, profile?.id, staffDirectory]);

  const staffColumnCount = Math.max(staffForViewer.length, 1);

  const currentDateKey = useMemo(() => formatDateKey(currentDate), [currentDate]);

  const dayAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.date === currentDateKey),
    [appointments, currentDateKey]
  );

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate);
    return Array.from({ length: 7 }, (_, index) => addDays(start, index));
  }, [currentDate]);

  const weekAppointments = useMemo(() => {
    const grouped = new Map<string, Appointment[]>();
    weekDays.forEach((day) => {
      grouped.set(formatDateKey(day), []);
    });
    appointments.forEach((appointment) => {
      if (grouped.has(appointment.date)) {
        grouped.get(appointment.date)?.push(appointment);
      }
    });
    grouped.forEach((list) => list.sort((a, b) => a.startMinutes - b.startMinutes));
    return grouped;
  }, [appointments, weekDays]);

  if (loading) {
    return <div className="px-6 py-10 text-sm text-white/70">Loading calendar…</div>;
  }

  if (!legacyRole || !canAccessRoute(legacyRole, "calendar")) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-white/80">
        <h1 className="text-2xl font-semibold text-white">Calendar unavailable</h1>
        <p className="mt-3 text-sm">
          Your profile does not have access to the scheduling calendar. If you believe this is a mistake, please
          contact a manager or administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 text-white">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Scheduling calendar</h1>
          <p className="text-sm text-white/70">
            {view === "day"
              ? new Date(currentDate).toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })
              : `${weekDays[0].toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })} – ${weekDays[6].toLocaleDateString(undefined, { month: "short", day: "numeric" })}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-full border border-white/20 bg-white/10 p-1 text-xs">
            {(["day", "week"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleViewChange(option)}
                className={clsx(
                  "rounded-full px-3 py-1.5 font-semibold capitalize transition",
                  view === option ? "bg-white text-slate-900" : "text-white/70 hover:text-white"
                )}
              >
                {option}
              </button>
            ))}
          </div>
          <div className="flex rounded-full border border-white/20 bg-white/10 text-xs">
            <button
              type="button"
              onClick={goPrevious}
              className="rounded-l-full px-3 py-1.5 font-semibold text-white/80 transition hover:text-white"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={goToToday}
              className="border-x border-white/20 px-4 py-1.5 font-semibold text-white transition hover:bg-white hover:text-slate-900"
            >
              Today
            </button>
            <button
              type="button"
              onClick={goNext}
              className="rounded-r-full px-3 py-1.5 font-semibold text-white/80 transition hover:text-white"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-white/60">
        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">Drag on empty space to create</span>
        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">Drag cards to move</span>
        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">Use handles to resize</span>
        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">Click to edit details</span>
      </div>

      {catalogError && (
        <div className="rounded-3xl border border-rose-400/40 bg-rose-500/20 px-5 py-4 text-sm text-rose-100">
          {catalogError}
        </div>
      )}

      {catalogLoading && staffDirectory.length === 0 && (
        <div className="rounded-3xl border border-white/15 bg-white/5 px-5 py-4 text-sm text-white/70">
          Loading staff and services…
        </div>
      )}

      {!catalogLoading && staffDirectory.length === 0 && (
        <div className="rounded-3xl border border-dashed border-white/20 bg-white/5 px-5 py-4 text-sm text-white/70">
          Add staff members to the Employees area to start scheduling.
        </div>
      )}

      {!catalogLoading && serviceCatalog.length === 0 && (
        <div className="rounded-3xl border border-dashed border-white/20 bg-white/5 px-5 py-4 text-sm text-white/70">
          Create services in settings so bookings know what to schedule.
        </div>
      )}

      {view === "day" ? (
        <div className="overflow-hidden rounded-3xl border border-white/15 bg-white/5">
          <div
            className="grid"
            style={{ gridTemplateColumns: `80px repeat(${staffColumnCount}, minmax(200px, 1fr))` }}
          >
            <div className="border-b border-white/10 bg-white/5 p-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
              Time
            </div>
            {staffForViewer.map((staff) => (
              <div key={staff.id} className="border-b border-white/10 bg-white/5 p-3">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-xs font-semibold uppercase tracking-[0.2em]">
                    {staff.initials}
                  </span>
                  <div className="flex flex-col text-sm">
                    <span className="font-semibold text-white">{staff.name}</span>
                    <span className="text-white/60">{appointments.filter((appt) => appt.date === currentDateKey && appt.staffId === staff.id).length} appointments</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div
            className="grid"
            style={{ gridTemplateColumns: `80px repeat(${staffColumnCount}, minmax(200px, 1fr))` }}
          >
            <div className="relative" style={{ height: COLUMN_HEIGHT }}>
              {Array.from({ length: DAY_END_MINUTES / 60 - DAY_START_MINUTES / 60 + 1 }, (_, index) => {
                const hour = Math.floor(DAY_START_MINUTES / 60) + index;
                return (
                  <div key={hour} className="absolute left-0 right-0" style={{ top: minutesToOffset(hour * 60) }}>
                    <div className="h-px w-full bg-white/10" />
                    <span className="-mt-2 block px-3 text-xs text-white/60">{formatTime(hour * 60)}</span>
                  </div>
                );
              })}
            </div>
            {staffForViewer.map((staff) => {
              const columnAppointments = dayAppointments
                .filter((appointment) => appointment.staffId === staff.id)
                .sort((a, b) => a.startMinutes - b.startMinutes);
              return (
                <div
                  key={staff.id}
                  ref={(node) => {
                    columnRefs.current[staff.id] = node;
                  }}
                  style={{ height: COLUMN_HEIGHT }}
                  className="relative border-l border-white/10 bg-white/[0.04]"
                  onPointerDown={(event) => beginCreate(staff.id, currentDateKey, event)}
                >
                  {columnAppointments.map((appointment) => {
                    const top = minutesToOffset(appointment.startMinutes);
                    const height = durationToHeight(appointment.endMinutes - appointment.startMinutes);
                    return (
                      <div
                        key={appointment.id}
                        data-appointment-id={appointment.id}
                        className={clsx(
                          "absolute left-1 right-1 cursor-grab overflow-hidden rounded-2xl border border-white/20 shadow-lg shadow-black/30 transition", // base
                          staff.colorClass
                        )}
                        style={{ top, height }}
                        onPointerDown={(event) => beginMove(appointment, event)}
                        onClick={() => openDrawer(appointment.id)}
                      >
                        <div className="px-3 py-2 text-xs">
                          <p className="text-[0.7rem] uppercase tracking-[0.3em] text-white/70">
                            {serviceCatalog.find((service) => service.id === appointment.serviceId)?.name ?? "Service"}
                          </p>
                          <p className="text-sm font-semibold text-white">{appointment.petName}</p>
                          <p className="text-xs text-white/80">
                            {formatTime(appointment.startMinutes)} – {formatTime(appointment.endMinutes)}
                          </p>
                          <p className="mt-1 text-[0.7rem] uppercase tracking-[0.3em] text-white/70">{appointment.status.replace(/_/g, " ")}</p>
                        </div>
                        <div
                          role="presentation"
                          data-role="resize-handle"
                          onPointerDown={(event) => beginResize(appointment, "start", event)}
                          className="absolute left-0 right-0 top-0 h-2 cursor-ns-resize"
                        />
                        <div
                          role="presentation"
                          data-role="resize-handle"
                          onPointerDown={(event) => beginResize(appointment, "end", event)}
                          className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize"
                        />
                      </div>
                    );
                  })}

                  {interaction?.type === "create" && interaction.staffId === staff.id && (
                    <div
                      className="absolute left-1 right-1 rounded-2xl border border-dashed border-white/40 bg-white/20"
                      style={{
                        top: minutesToOffset(Math.min(interaction.startMinutes, interaction.endMinutes)),
                        height: durationToHeight(
                          Math.max(
                            STEP_MINUTES,
                            Math.abs(interaction.endMinutes - interaction.startMinutes)
                          )
                        ),
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {weekDays.map((day) => {
            const key = formatDateKey(day);
            const dayEntries = weekAppointments.get(key) ?? [];
            return (
              <section key={key} className="space-y-3 rounded-3xl border border-white/15 bg-white/5 p-5">
                <header className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                      {day.toLocaleDateString(undefined, { weekday: "short" })}
                    </p>
                    <h2 className="text-lg font-semibold text-white">
                      {day.toLocaleDateString(undefined, { month: "long", day: "numeric" })}
                    </h2>
                  </div>
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/70">
                    {dayEntries.length} booked
                  </span>
                </header>
                {dayEntries.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-6 text-sm text-white/60">
                    No appointments scheduled.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {dayEntries.map((appointment) => {
                      const staff = staffDirectory.find((member) => member.id === appointment.staffId);
                      const service = serviceCatalog.find((svc) => svc.id === appointment.serviceId);
                      return (
                        <li
                          key={appointment.id}
                          className="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm transition hover:border-white/30 hover:bg-white/20"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-white">{appointment.petName}</p>
                              <p className="text-xs text-white/70">{appointment.clientName}</p>
                              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
                                {service?.name ?? "Service"}
                              </p>
                            </div>
                            <div className="text-right text-xs text-white/70">
                              <p>{formatTime(appointment.startMinutes)}</p>
                              <p>{formatTime(appointment.endMinutes)}</p>
                              <p className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[0.65rem] uppercase tracking-[0.3em]">
                                {staff?.initials ?? "--"}
                                <span>{appointment.status.replace(/_/g, " ")}</span>
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => openDrawer(appointment.id)}
                            className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:border-white/30 hover:text-white"
                          >
                            Edit details
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}

      <AppointmentDetailDrawer
        open={drawerState.open && !!drawerValue}
        staff={staffForViewer}
        services={serviceCatalog}
        addOns={addOnCatalog}
        value={drawerValue}
        onClose={closeDrawer}
        onSubmit={handleDrawerSubmit}
        onDelete={handleDrawerDelete}
      />
    </div>
  );
}
