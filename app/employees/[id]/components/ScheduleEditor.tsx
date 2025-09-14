"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Widget from "@/components/Widget";
import { supabase } from "@/supabase/client";

/**
 * A type describing a single time slot within a day. A slot has a start and end time
 * in HH:MM 24‑hour format.
 */
type TimeSlot = {
  start: string;
  end: string;
};

/**
 * A type describing a single time‑off request. Each request belongs to a specific date
 * and has a status that can be pending, approved or denied.
 */
type TimeOffRequest = {
  id: string;
  date: string;
  reason?: string;
  status: "pending" | "approved" | "denied";
};

/**
 * The schedule consists of a mapping of days of the week to an array of time slots,
 * along with a list of time‑off requests. Each employee maintains their own schedule.
 */
export interface Schedule {
  regular: {
    mon: TimeSlot[];
    tue: TimeSlot[];
    wed: TimeSlot[];
    thu: TimeSlot[];
    fri: TimeSlot[];
    sat: TimeSlot[];
    sun: TimeSlot[];
  };
  requests: TimeOffRequest[];
}

interface ScheduleEditorProps {
  employeeId: string;
  initialSchedule: Schedule | null;
}

/**
 * ScheduleEditor displays and allows editing of an employee's weekly schedule. It lets the owner
 * add or remove time slots for each day, approve or deny vacation requests and persist
 * changes back to Supabase. Once saved, the updated schedule will be reflected throughout
 * the application.
 */
export default function ScheduleEditor({ employeeId, initialSchedule }: ScheduleEditorProps) {
  // The local schedule state mirrors the schedule in the database. If no schedule exists,
  // initialise with a blank template.
  const [schedule, setSchedule] = useState<Schedule | null>(initialSchedule);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  // On mount, ensure schedule has a valid structure. If initialSchedule is null, populate
  // with empty arrays so the UI can render without errors.
  useEffect(() => {
    if (!schedule) {
      const blankSlots: TimeSlot[] = [];
      setSchedule({
        regular: {
          mon: [...blankSlots],
          tue: [...blankSlots],
          wed: [...blankSlots],
          thu: [...blankSlots],
          fri: [...blankSlots],
          sat: [...blankSlots],
          sun: [...blankSlots],
        },
        requests: [],
      });
    }
  }, [schedule]);

  // Utility to update a slot time for a given day and index. This avoids repeated state
  // cloning and ensures React picks up the change.
  const updateSlot = (day: keyof Schedule["regular"], idx: number, field: keyof TimeSlot, value: string) => {
    if (!schedule) return;
    setSchedule((prev) => {
      if (!prev) return prev;
      const updatedDay = prev.regular[day].map((slot, i) =>
        i === idx ? { ...slot, [field]: value } : slot
      );
      return {
        ...prev,
        regular: {
          ...prev.regular,
          [day]: updatedDay,
        },
      };
    });
  };

  // Add a new empty time slot to a given day.
  const addSlot = (day: keyof Schedule["regular"]) => {
    if (!schedule) return;
    setSchedule((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        regular: {
          ...prev.regular,
          [day]: [...prev.regular[day], { start: "09:00", end: "17:00" }],
        },
      };
    });
  };

  // Remove a slot by index from a given day.
  const removeSlot = (day: keyof Schedule["regular"], idx: number) => {
    if (!schedule) return;
    setSchedule((prev) => {
      if (!prev) return prev;
      const updated = prev.regular[day].filter((_, i) => i !== idx);
      return {
        ...prev,
        regular: {
          ...prev.regular,
          [day]: updated,
        },
      };
    });
  };

  // Approve a time off request. Update the local state and persist to Supabase.
  const approveRequest = async (requestId: string) => {
    if (!schedule) return;
    const updatedRequests: TimeOffRequest[] = schedule.requests.map((req) =>
      req.id === requestId ? { ...req, status: "approved" as const } : req
    );
    await persistSchedule({ ...(schedule as Schedule), requests: updatedRequests });
  };

  // Deny a time off request. Update the local state and persist to Supabase.
  const denyRequest = async (requestId: string) => {
    if (!schedule) return;
    const updatedRequests: TimeOffRequest[] = schedule.requests.map((req) =>
      req.id === requestId ? { ...req, status: "denied" as const } : req
    );
    await persistSchedule({ ...(schedule as Schedule), requests: updatedRequests });
  };

  /**
   * Persist the schedule back to the employees table. Uses upsert semantics so that
   * missing rows will be inserted. After saving, refresh the router to update other
   * components that depend on this schedule.
   */
  const persistSchedule = async (newSchedule: Schedule) => {
    setSaving(true);
    try {
      await supabase
        .from("employees")
        .update({ schedule: newSchedule })
        .eq("id", employeeId);
      // Update local state after successful save
      setSchedule(newSchedule);
      router.refresh();
    } catch (err) {
      console.error("Error saving schedule", err);
    } finally {
      setSaving(false);
    }
  };

  // Handler for the Save button. Simply persist the current schedule state.
  const saveChanges = async () => {
    if (!schedule) return;
    await persistSchedule(schedule);
  };

  if (!schedule) {
    return <div>Loading schedule...</div>;
  }

  // Helper to render day names in a friendly format. This mapping ensures consistent
  // ordering and labels.
  const dayOrder: (keyof Schedule["regular"])[] = [
    "mon",
    "tue",
    "wed",
    "thu",
    "fri",
    "sat",
    "sun",
  ];
  const dayLabel: Record<keyof Schedule["regular"], string> = {
    mon: "Monday",
    tue: "Tuesday",
    wed: "Wednesday",
    thu: "Thursday",
    fri: "Friday",
    sat: "Saturday",
    sun: "Sunday",
  };

  return (
    <Widget title="Schedule" className="mb-6">
      {/* Render the weekly schedule grid */}
      {dayOrder.map((day) => (
        <div key={day} className="mb-4">
          <h4 className="font-semibold mb-2">{dayLabel[day]}</h4>
          {schedule.regular[day].map((slot, idx) => (
            <div key={idx} className="flex items-center space-x-2 mb-2">
              <input
                type="time"
                value={slot.start}
                onChange={(e) => updateSlot(day, idx, "start", e.target.value)}
                className="border rounded px-2 py-1"
              />
              <span>–</span>
              <input
                type="time"
                value={slot.end}
                onChange={(e) => updateSlot(day, idx, "end", e.target.value)}
                className="border rounded px-2 py-1"
              />
              <button
                type="button"
                onClick={() => removeSlot(day, idx)}
                className="text-red-500 text-sm"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addSlot(day)}
            className="text-blue-500 text-sm"
          >
            + Add Slot
          </button>
        </div>
      ))}
      {/* Render time off requests */}
      <h4 className="font-semibold mb-2">Time Off Requests</h4>
      {schedule.requests.length === 0 ? (
        <p className="text-sm text-gray-500 mb-4">No requests</p>
      ) : (
        schedule.requests.map((req) => (
          <div key={req.id} className="border rounded p-2 mb-2">
            <p className="text-sm">
              {req.date}
              {req.reason ? ` – ${req.reason}` : ""} ({req.status})
            </p>
            {req.status === "pending" && (
              <div className="flex space-x-4 mt-1">
                <button
                  type="button"
                  onClick={() => approveRequest(req.id)}
                  className="text-green-500 text-sm"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => denyRequest(req.id)}
                  className="text-red-500 text-sm"
                >
                  Deny
                </button>
              </div>
            )}
          </div>
        ))
      )}
      {/* Save button */}
      <button
        type="button"
        onClick={saveChanges}
        disabled={saving}
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
      >
        {saving ? "Saving…" : "Save Schedule"}
      </button>
    </Widget>
  );
}