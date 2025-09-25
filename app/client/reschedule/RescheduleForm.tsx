"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { RescheduleReadyContext, SlotOption } from "./types";

const slotTimeFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const confirmationFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "full",
  timeStyle: "short",
});

function formatSlotLabel(slot: SlotOption) {
  return slotTimeFormatter.format(new Date(slot.startIso));
}

function formatSuccessTime(iso: string) {
  return confirmationFormatter.format(new Date(iso));
}

function findSlot(slots: SlotOption[], id: string | null) {
  if (!id) return null;
  return slots.find((slot) => slot.id === id) ?? null;
}

export default function RescheduleForm({ context }: { context: RescheduleReadyContext }) {
  const { appointment, slots, token } = context;
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(slots[0]?.id ?? null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ startsAtIso: string; staffName: string | null } | null>(null);

  const hasSlots = slots.length > 0;
  const submitDisabled = !hasSlots || !selectedSlotId || submitting;

  const selectedSlot = useMemo(() => findSlot(slots, selectedSlotId), [slots, selectedSlotId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSlot) return;
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/reschedule/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          starts_at: selectedSlot.startIso,
          staff_id: selectedSlot.staffId,
          service_id: appointment.serviceId,
        }),
      });

      const payload = await response.json().catch(() => ({ error: "Unexpected response from server." }));

      if (!response.ok) {
        setError(typeof payload.error === "string" ? payload.error : "Could not reschedule this appointment.");
        setSubmitting(false);
        return;
      }

      const newStartIso = (payload.appointment?.starts_at as string | undefined) ?? selectedSlot.startIso;
      const newStaffName = selectedSlot.staffName ?? null;
      setSuccess({ startsAtIso: newStartIso, staffName: newStaffName });
    } catch (err) {
      console.error("Reschedule submission failed", err);
      setError("Something went wrong while rescheduling. Please try again.");
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="mt-8 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-6 py-5 text-sm text-emerald-100">
        <p>
          Your appointment has been moved to {formatSuccessTime(success.startsAtIso)}
          {success.staffName ? ` with ${success.staffName}` : ""}.
        </p>
        <Link
          href="/client"
          className="mt-4 inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-navy transition hover:bg-white/90"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Choose a new time</h2>
        <p className="mt-1 text-sm text-white/70">
          Select one of the open time slots below and we&apos;ll update your booking instantly.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-6 py-4 text-sm text-red-100">{error}</div>
      )}

      {hasSlots ? (
        <div className="grid gap-3 md:grid-cols-2">
          {slots.map((slot) => {
            const isSelected = slot.id === selectedSlotId;
            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => setSelectedSlotId(slot.id)}
                className={`rounded-2xl border px-4 py-3 text-left transition ${
                  isSelected
                    ? "border-white bg-white/20 text-white"
                    : "border-white/20 bg-white/10 text-white/90 hover:border-white/40 hover:bg-white/20"
                }`}
              >
                <span className="block text-sm font-semibold">{formatSlotLabel(slot)}</span>
                <span className="mt-1 block text-xs text-white/70">With {slot.staffName}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-white/80">
          We couldn&apos;t find any open slots in the next few weeks. Please contact the salon and we&apos;ll help you reschedule.
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={submitDisabled}
          className={`inline-flex items-center rounded-full px-5 py-2 text-sm font-semibold transition ${
            submitDisabled
              ? "cursor-not-allowed border border-white/10 bg-white/10 text-white/50"
              : "bg-white text-brand-navy hover:bg-white/90"
          }`}
        >
          {submitting ? "Rescheduling…" : "Confirm new time"}
        </button>
        <Link
          href="/client"
          className="inline-flex items-center rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white/80 transition hover:border-white/40 hover:bg-white/10"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
