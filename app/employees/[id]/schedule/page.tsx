"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase/client";
import { useEmployeeDetail } from "../EmployeeDetailClient";

type AvailabilityRule = {
  id: string;
  rrule_text: string;
  tz: string;
  buffer_pre_min: number;
  buffer_post_min: number;
  created_at: string;
};

type BlackoutDate = {
  id: string;
  starts_at: string;
  ends_at: string;
  created_at: string;
};

type AvailabilityFormState = {
  days: string[];
  startTime: string;
  endTime: string;
  tz: string;
  bufferPre: number;
  bufferPost: number;
};

type BlackoutFormState = {
  start: string;
  end: string;
};

const DEFAULT_BUFFER_MINUTES = 10;

const dayOptions = [
  { value: "MO", label: "Mon" },
  { value: "TU", label: "Tue" },
  { value: "WE", label: "Wed" },
  { value: "TH", label: "Thu" },
  { value: "FR", label: "Fri" },
  { value: "SA", label: "Sat" },
  { value: "SU", label: "Sun" },
];

function parseRRule(rrule: string) {
  const segments = rrule.split(";");
  const map = new Map<string, string>();
  segments.forEach((segment) => {
    const [key, value] = segment.split("=");
    if (key && value) {
      map.set(key.toUpperCase(), value);
    }
  });
  const days = map.get("BYDAY")?.split(",").filter(Boolean) ?? [];
  const hour = Number(map.get("BYHOUR") ?? 9);
  const minute = Number(map.get("BYMINUTE") ?? 0);
  const duration = parseDurationToMinutes(map.get("DURATION") ?? "PT480M");
  const startMinutes = hour * 60 + minute;
  const endMinutes = startMinutes + duration;
  return {
    days,
    startTime: formatMinutes(startMinutes),
    endTime: formatMinutes(endMinutes),
  };
}

function parseDurationToMinutes(value: string) {
  const match = /PT(?:(\d+)H)?(?:(\d+)M)?/i.exec(value);
  if (!match) return 8 * 60;
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  return hours * 60 + minutes;
}

function formatMinutes(total: number) {
  const clamped = Math.max(0, total);
  const hours = Math.floor(clamped / 60);
  const minutes = clamped % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function toDisplayTime(value: string) {
  const [hours, minutes] = value.split(":").map((part) => Number(part));
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function describeRule(rule: AvailabilityRule) {
  const parsed = parseRRule(rule.rrule_text);
  const dayLabels = parsed.days
    .map((code) => dayOptions.find((day) => day.value === code)?.label ?? code)
    .join(", ");
  const start = toDisplayTime(parsed.startTime);
  const end = toDisplayTime(parsed.endTime);
  return {
    summary: `Weekly on ${dayLabels || "—"}`,
    window: `${start} – ${end} (${rule.tz})`,
  };
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function buildRRule(days: string[], start: string, end: string) {
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);
  const duration = Math.max(30, endMinutes - startMinutes);
  const startHour = Math.floor(startMinutes / 60);
  const startMinute = startMinutes % 60;
  const byday = days.join(",");
  return `FREQ=WEEKLY;BYDAY=${byday};BYHOUR=${startHour};BYMINUTE=${startMinute};BYSECOND=0;DURATION=PT${duration}M`;
}

export default function EmployeeSchedulePage() {
  const { employee, viewerCanEditStaff, pushToast } = useEmployeeDetail();
  const timezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone ?? "America/New_York",
    []
  );
  const [availability, setAvailability] = useState<AvailabilityRule[]>([]);
  const [blackouts, setBlackouts] = useState<BlackoutDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [availabilityForm, setAvailabilityForm] = useState<AvailabilityFormState>(
    () => ({
      days: ["TU", "WE", "TH"],
      startTime: "09:00",
      endTime: "17:00",
      tz: timezone,
      bufferPre: DEFAULT_BUFFER_MINUTES,
      bufferPost: DEFAULT_BUFFER_MINUTES,
    })
  );
  const [blackoutForm, setBlackoutForm] = useState<BlackoutFormState>({ start: "", end: "" });
  const [showBufferFields, setShowBufferFields] = useState(false);

  const staffProfileId = useMemo(() => employee.user_id ?? String(employee.id), [employee.id, employee.user_id]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [availabilityRes, blackoutRes] = await Promise.all([
      supabase
        .from("availability_rules")
        .select("id,rrule_text,tz,buffer_pre_min,buffer_post_min,created_at")
        .eq("staff_id", staffProfileId)
        .order("created_at", { ascending: true }),
      supabase
        .from("blackout_dates")
        .select("id,starts_at,ends_at,created_at")
        .eq("staff_id", staffProfileId)
        .order("starts_at", { ascending: true }),
    ]);

    if (!availabilityRes.error && Array.isArray(availabilityRes.data)) {
      setAvailability(
        availabilityRes.data.map((row) => ({
          id: String(row.id),
          rrule_text: row.rrule_text,
          tz: row.tz,
          buffer_pre_min: row.buffer_pre_min ?? DEFAULT_BUFFER_MINUTES,
          buffer_post_min: row.buffer_post_min ?? DEFAULT_BUFFER_MINUTES,
          created_at: row.created_at,
        }))
      );
    }

    if (!blackoutRes.error && Array.isArray(blackoutRes.data)) {
      setBlackouts(
        blackoutRes.data.map((row) => ({
          id: String(row.id),
          starts_at: row.starts_at,
          ends_at: row.ends_at,
          created_at: row.created_at,
        }))
      );
    }
    setLoading(false);
  }, [staffProfileId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function resetForm() {
    setEditingRuleId(null);
    setAvailabilityForm({
      days: ["TU", "WE", "TH"],
      startTime: "09:00",
      endTime: "17:00",
      tz: timezone,
      bufferPre: DEFAULT_BUFFER_MINUTES,
      bufferPost: DEFAULT_BUFFER_MINUTES,
    });
    setShowBufferFields(false);
  }

  async function saveAvailability() {
    if (!viewerCanEditStaff) {
      pushToast("You do not have permission to edit availability.", "error");
      return;
    }

    if (availabilityForm.days.length === 0) {
      pushToast("Select at least one day.", "error");
      return;
    }

    const startMinutes = timeToMinutes(availabilityForm.startTime);
    const endMinutes = timeToMinutes(availabilityForm.endTime);
    if (endMinutes <= startMinutes) {
      pushToast("End time must be after start time.", "error");
      return;
    }

    const rrule = buildRRule(
      availabilityForm.days,
      availabilityForm.startTime,
      availabilityForm.endTime
    );

    setSaving(true);
    const payload = {
      staff_id: staffProfileId,
      rrule_text: rrule,
      tz: availabilityForm.tz,
      buffer_pre_min: showBufferFields
        ? availabilityForm.bufferPre
        : DEFAULT_BUFFER_MINUTES,
      buffer_post_min: showBufferFields
        ? availabilityForm.bufferPost
        : DEFAULT_BUFFER_MINUTES,
    };

    const query = editingRuleId
      ? supabase.from("availability_rules").update(payload).eq("id", editingRuleId)
      : supabase.from("availability_rules").insert(payload);

    const { error } = await query;
    setSaving(false);

    if (error) {
      pushToast(error.message ?? "Unable to save availability", "error");
      return;
    }

    pushToast(editingRuleId ? "Availability updated" : "Availability added", "success");
    resetForm();
    void loadData();
  }

  function handleEdit(rule: AvailabilityRule) {
    const parsed = parseRRule(rule.rrule_text);
    setAvailabilityForm({
      days: parsed.days.length ? parsed.days : ["TU", "WE", "TH"],
      startTime: parsed.startTime,
      endTime: parsed.endTime,
      tz: rule.tz,
      bufferPre: rule.buffer_pre_min,
      bufferPost: rule.buffer_post_min,
    });
    setShowBufferFields(
      rule.buffer_pre_min !== DEFAULT_BUFFER_MINUTES || rule.buffer_post_min !== DEFAULT_BUFFER_MINUTES
    );
    setEditingRuleId(rule.id);
  }

  async function handleDelete(rule: AvailabilityRule) {
    if (!viewerCanEditStaff) {
      pushToast("You do not have permission to edit availability.", "error");
      return;
    }
    const { error } = await supabase.from("availability_rules").delete().eq("id", rule.id);
    if (error) {
      pushToast(error.message ?? "Unable to delete availability", "error");
      return;
    }
    pushToast("Availability removed", "success");
    resetForm();
    void loadData();
  }

  async function saveBlackout() {
    if (!viewerCanEditStaff) {
      pushToast("You do not have permission to edit availability.", "error");
      return;
    }
    if (!blackoutForm.start || !blackoutForm.end) {
      pushToast("Select start and end times.", "error");
      return;
    }
    const start = new Date(blackoutForm.start);
    const end = new Date(blackoutForm.end);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      pushToast("Blackout end must be after start.", "error");
      return;
    }
    const { error } = await supabase.from("blackout_dates").insert({
      staff_id: staffProfileId,
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
    });
    if (error) {
      pushToast(error.message ?? "Unable to add blackout", "error");
      return;
    }
    pushToast("Blackout added", "success");
    setBlackoutForm({ start: "", end: "" });
    void loadData();
  }

  async function removeBlackout(entry: BlackoutDate) {
    if (!viewerCanEditStaff) {
      pushToast("You do not have permission to edit availability.", "error");
      return;
    }
    const { error } = await supabase.from("blackout_dates").delete().eq("id", entry.id);
    if (error) {
      pushToast(error.message ?? "Unable to delete blackout", "error");
      return;
    }
    pushToast("Blackout removed", "success");
    void loadData();
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Availability</p>
          <h1 className="text-2xl font-semibold text-white">Scheduling rules</h1>
          <p className="mt-1 text-sm text-white/70">
            Manage recurring availability and blackout periods for {employee.name ?? "staff"}.
          </p>
        </div>
        <a
          href={`/calendar?staffId=${encodeURIComponent(staffProfileId)}`}
          className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/80 transition hover:border-white/40 hover:text-white"
        >
          Open in calendar
        </a>
      </header>

      <section className="rounded-3xl border border-white/15 bg-white/5 p-6 text-white">
        <h2 className="text-lg font-semibold">Recurring availability</h2>
        <p className="mt-1 text-sm text-white/60">
          Choose the days and working window when this groomer is available. Buffers apply before and after each
          appointment.
        </p>
        <div className="mt-5 grid gap-5 lg:grid-cols-[2fr,3fr]">
          <form className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Days</p>
              <div className="mt-2 grid grid-cols-4 gap-2 text-sm">
                {dayOptions.map((day) => {
                  const active = availabilityForm.days.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() =>
                        setAvailabilityForm((prev) => ({
                          ...prev,
                          days: active
                            ? prev.days.filter((value) => value !== day.value)
                            : [...prev.days, day.value],
                        }))
                      }
                      className={`rounded-xl border px-3 py-2 transition ${
                        active
                          ? "border-brand-bubble/70 bg-brand-bubble/20 text-white"
                          : "border-white/10 bg-white/5 text-white/70 hover:border-white/25 hover:bg-white/10"
                      }`}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <label className="flex flex-col gap-1">
                <span className="text-white/70">Start time</span>
                <input
                  type="time"
                  value={availabilityForm.startTime}
                  onChange={(event) =>
                    setAvailabilityForm((prev) => ({ ...prev, startTime: event.target.value }))
                  }
                  className="h-10 rounded-xl border border-white/20 bg-white/10 px-3 text-sm text-white focus:border-white/40 focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-white/70">End time</span>
                <input
                  type="time"
                  value={availabilityForm.endTime}
                  onChange={(event) =>
                    setAvailabilityForm((prev) => ({ ...prev, endTime: event.target.value }))
                  }
                  className="h-10 rounded-xl border border-white/20 bg-white/10 px-3 text-sm text-white focus:border-white/40 focus:outline-none"
                />
              </label>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">Scheduling timezone</p>
              <p className="mt-1 text-white/80">{availabilityForm.tz}</p>
            </div>

            <div className="space-y-3 text-sm">
              <label className="flex items-center gap-2 text-white/70">
                <input
                  type="checkbox"
                  checked={showBufferFields}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    setShowBufferFields(checked);
                    if (!checked) {
                      setAvailabilityForm((prev) => ({
                        ...prev,
                        bufferPre: DEFAULT_BUFFER_MINUTES,
                        bufferPost: DEFAULT_BUFFER_MINUTES,
                      }));
                    }
                  }}
                  className="h-4 w-4 rounded border border-white/30 bg-white/10 text-brand-bubble focus:ring-brand-bubble"
                />
                <span>Customize appointment buffers</span>
              </label>
              {showBufferFields && (
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-white/70">Buffer before (min)</span>
                    <input
                      type="number"
                      min={0}
                      value={availabilityForm.bufferPre}
                      onChange={(event) =>
                        setAvailabilityForm((prev) => ({
                          ...prev,
                          bufferPre: Number(event.target.value) || 0,
                        }))
                      }
                      className="h-10 rounded-xl border border-white/20 bg-white/10 px-3 text-sm text-white focus:border-white/40 focus:outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-white/70">Buffer after (min)</span>
                    <input
                      type="number"
                      min={0}
                      value={availabilityForm.bufferPost}
                      onChange={(event) =>
                        setAvailabilityForm((prev) => ({
                          ...prev,
                          bufferPost: Number(event.target.value) || 0,
                        }))
                      }
                      className="h-10 rounded-xl border border-white/20 bg-white/10 px-3 text-sm text-white focus:border-white/40 focus:outline-none"
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={saveAvailability}
                disabled={saving}
                className="rounded-full border border-white/60 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-900 transition hover:brightness-105 disabled:opacity-60"
              >
                {editingRuleId ? "Update availability" : "Add availability"}
              </button>
              {editingRuleId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:border-white/30 hover:text-white"
                >
                  Cancel edit
                </button>
              )}
            </div>
          </form>

          <div className="space-y-3">
            {loading ? (
              <p className="text-sm text-white/60">Loading availability…</p>
            ) : availability.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/20 bg-white/5 px-5 py-8 text-sm text-white/60">
                No availability rules yet.
              </p>
            ) : (
              availability.map((rule) => {
                const { summary, window } = describeRule(rule);
                return (
                  <article
                    key={rule.id}
                    className="flex items-start justify-between gap-3 rounded-2xl border border-white/15 bg-white/10 p-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">{summary}</p>
                      <p className="text-xs text-white/60">{window}</p>
                      <p className="mt-1 text-xs text-white/40">
                        Buffer {rule.buffer_pre_min}m before · {rule.buffer_post_min}m after
                      </p>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => handleEdit(rule)}
                        className="rounded-full border border-white/20 bg-white/5 px-3 py-1 font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:border-white/40 hover:text-white"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(rule)}
                        className="rounded-full border border-red-400/40 bg-red-500/10 px-3 py-1 font-semibold uppercase tracking-[0.3em] text-red-200 transition hover:border-red-400/60"
                      >
                        Remove
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/15 bg-white/5 p-6 text-white">
        <h2 className="text-lg font-semibold">Blackout dates</h2>
        <p className="mt-1 text-sm text-white/60">
          Schedule time away for vacations, education days or maintenance windows. These blocks override recurring
          availability.
        </p>
        <div className="mt-5 grid gap-5 lg:grid-cols-[2fr,3fr]">
          <form className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-white/70">Starts</span>
              <input
                type="datetime-local"
                value={blackoutForm.start}
                onChange={(event) => setBlackoutForm((prev) => ({ ...prev, start: event.target.value }))}
                className="h-10 rounded-xl border border-white/20 bg-white/10 px-3 text-sm text-white focus:border-white/40 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-white/70">Ends</span>
              <input
                type="datetime-local"
                value={blackoutForm.end}
                onChange={(event) => setBlackoutForm((prev) => ({ ...prev, end: event.target.value }))}
                className="h-10 rounded-xl border border-white/20 bg-white/10 px-3 text-sm text-white focus:border-white/40 focus:outline-none"
              />
            </label>
            <button
              type="button"
              onClick={saveBlackout}
              className="rounded-full border border-white/60 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-900 transition hover:brightness-105"
            >
              Add blackout
            </button>
          </form>

          <div className="space-y-3">
            {loading ? (
              <p className="text-sm text-white/60">Loading blackout dates…</p>
            ) : blackouts.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/20 bg-white/5 px-5 py-8 text-sm text-white/60">
                No blackouts added.
              </p>
            ) : (
              blackouts.map((entry) => {
                const start = new Date(entry.starts_at);
                const end = new Date(entry.ends_at);
                return (
                  <article
                    key={entry.id}
                    className="flex items-start justify-between gap-3 rounded-2xl border border-white/15 bg-white/10 p-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {start.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                        {" – "}
                        {end.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </p>
                      <p className="text-xs text-white/60">
                        {start.toLocaleString()} → {end.toLocaleString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBlackout(entry)}
                      className="rounded-full border border-red-400/40 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-red-200 transition hover:border-red-400/60"
                    >
                      Remove
                    </button>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
