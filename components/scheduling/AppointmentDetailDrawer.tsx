"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import clsx from "clsx";

import { useAuth } from "@/components/AuthProvider";
import { useAppointmentNotificationActions } from "@/hooks/useAppointmentNotificationActions";

export type DrawerStaffOption = { id: string; name: string };
export type DrawerServiceOption = {
  id: string;
  name: string;
  basePrice: number;
  sizes: { id: string; label: string; multiplier: number }[];
  color?: string;
};
export type DrawerAddOnOption = { id: string; name: string; price: number };

export type AppointmentDraft = {
  id?: string;
  staffId: string;
  serviceId: string;
  sizeId: string;
  addOnIds: string[];
  discount: number;
  tax: number;
  status: "booked" | "checked_in" | "in_progress" | "completed" | "canceled" | "no_show";
  notes?: string;
};

export type AppointmentDetailDrawerProps = {
  open: boolean;
  staff: DrawerStaffOption[];
  services: DrawerServiceOption[];
  addOns: DrawerAddOnOption[];
  value: AppointmentDraft | null;
  onClose: () => void;
  onSubmit: (draft: AppointmentDraft) => void;
  onDelete?: (id: string) => void;
};

const statusOptions: AppointmentDraft["status"][] = [
  "booked",
  "checked_in",
  "in_progress",
  "completed",
  "canceled",
  "no_show",
];

const currency = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const timestampFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

type ToastTone = "success" | "error" | "info";

type DrawerToast = {
  id: number;
  message: string;
  tone: ToastTone;
};

const toastToneStyles: Record<ToastTone, string> = {
  success: "bg-emerald-500/90 text-white",
  error: "bg-rose-500/90 text-white",
  info: "bg-white/90 text-slate-900",
};

export default function AppointmentDetailDrawer({
  open,
  staff,
  services,
  addOns,
  value,
  onClose,
  onSubmit,
  onDelete,
}: AppointmentDetailDrawerProps) {
  const [draft, setDraft] = useState<AppointmentDraft | null>(value);
  const { role } = useAuth();
  const [toast, setToast] = useState<DrawerToast | null>(null);

  const appointmentId = draft?.id ?? null;
  const allowedForActions = useMemo(
    () => ["master", "manager", "front_desk"].includes(role),
    [role]
  );

  const {
    lastSent,
    loadingAction,
    fetching: loadingActivity,
    fetchError: activityError,
    sendReminder,
    sendPickupReady,
    createReschedule,
  } = useAppointmentNotificationActions(allowedForActions ? appointmentId : null);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const pushToast = useCallback((message: string, tone: ToastTone = "info") => {
    setToast({ id: Date.now(), message, tone });
  }, []);

  const formatLastSent = useCallback(
    (timestamp: Date | null) => {
      if (activityError) return "—";
      if (loadingActivity) return "Loading…";
      if (!timestamp) return "Never";
      return timestampFormatter.format(timestamp);
    },
    [activityError, loadingActivity]
  );

  const handleSendReminder = useCallback(async () => {
    const result = await sendReminder();
    if (result.ok) {
      pushToast("Reminder queued", "success");
    } else if (result.message) {
      pushToast(result.message, "error");
    }
  }, [pushToast, sendReminder]);

  const handleSendPickup = useCallback(async () => {
    const result = await sendPickupReady();
    if (result.ok) {
      pushToast("Pickup notification sent", "success");
    } else if (result.message) {
      pushToast(result.message, "error");
    }
  }, [pushToast, sendPickupReady]);

  const handleCreateReschedule = useCallback(async () => {
    const result = await createReschedule();
    if (result.ok) {
      if (result.copied) {
        pushToast("Reschedule link copied", "success");
      } else if (result.message) {
        pushToast(result.message, "info");
      } else {
        pushToast("Reschedule link created", "success");
      }
    } else if (result.message) {
      pushToast(result.message, "error");
    }
  }, [createReschedule, pushToast]);

  const isReminderLoading = loadingAction === "reminder";
  const isPickupLoading = loadingAction === "pickup";
  const isRescheduleLoading = loadingAction === "reschedule";
  const showNotificationActions = allowedForActions && Boolean(appointmentId);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const service = useMemo(
    () => services.find((option) => option.id === draft?.serviceId) ?? null,
    [draft?.serviceId, services]
  );

  const selectedSize = useMemo(() => {
    if (!service || !draft) return null;
    return service.sizes.find((size) => size.id === draft.sizeId) ?? null;
  }, [draft, service]);

  const addOnTotal = useMemo(() => {
    if (!draft) return 0;
    return draft.addOnIds.reduce((sum, id) => {
      const option = addOns.find((addOn) => addOn.id === id);
      return sum + (option?.price ?? 0);
    }, 0);
  }, [addOns, draft]);

  const basePrice = useMemo(() => {
    if (!service || !selectedSize) return 0;
    return Math.round(service.basePrice * selectedSize.multiplier);
  }, [selectedSize, service]);

  const subtotal = basePrice + addOnTotal;
  const total = subtotal - (draft?.discount ?? 0) + (draft?.tax ?? 0);

  const serviceClasses = useMemo(() => {
    if (!service?.color) return "bg-brand-bubble/20 text-white";
    return service.color;
  }, [service]);

  if (!draft) return null;

  function updateDraft<T extends keyof AppointmentDraft>(key: T, value: AppointmentDraft[T]) {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function toggleAddOn(id: string) {
    setDraft((prev) => {
      if (!prev) return prev;
      const exists = prev.addOnIds.includes(id);
      return {
        ...prev,
        addOnIds: exists
          ? prev.addOnIds.filter((addOnId) => addOnId !== id)
          : [...prev.addOnIds, id],
      };
    });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!draft) return;
    onSubmit(draft);
  }

  return (
    <div
      className={clsx(
        "fixed inset-y-0 right-0 z-[60] w-full max-w-md transform border-l border-white/10 bg-slate-900/95 text-white shadow-2xl transition-transform relative",
        open ? "translate-x-0" : "translate-x-full"
      )}
      role="dialog"
      aria-modal="true"
    >
      {toast && (
        <div
          className={clsx(
            "absolute left-1/2 top-6 z-[70] w-[calc(100%-3rem)] max-w-sm -translate-x-1/2 rounded-full px-4 py-2 text-sm font-semibold shadow-lg",
            toastToneStyles[toast.tone]
          )}
        >
          {toast.message}
        </div>
      )}
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Appointment</p>
            <h2 className="text-xl font-semibold text-white">{draft.id ? "Edit appointment" : "New appointment"}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white/70 transition hover:bg-white/20"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-6">
            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-white/60">Team</h3>
              <div className="space-y-2">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-white/70">Assigned staff</span>
                  <select
                    value={draft.staffId}
                    onChange={(event) => updateDraft("staffId", event.target.value)}
                    className="h-10 rounded-lg border border-white/20 bg-white/10 px-3 text-sm text-white focus:border-white/40 focus:outline-none"
                  >
                    {staff.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-white/60">Service</h3>
              <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-white/70">Service</span>
                  <select
                    value={draft.serviceId}
                    onChange={(event) => updateDraft("serviceId", event.target.value)}
                    className="h-10 rounded-lg border border-white/20 bg-white/10 px-3 text-sm text-white focus:border-white/40 focus:outline-none"
                  >
                    {services.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </label>
                {service && (
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-white/70">Size</span>
                    <div className="grid grid-cols-2 gap-2">
                      {service.sizes.map((size) => {
                        const isActive = size.id === draft.sizeId;
                        return (
                          <button
                            key={size.id}
                            type="button"
                            onClick={() => updateDraft("sizeId", size.id)}
                            className={clsx(
                              "rounded-xl border px-3 py-2 text-left text-sm transition",
                              isActive
                                ? "border-white/60 bg-white/15 text-white"
                                : "border-white/15 bg-white/5 text-white/70 hover:border-white/25 hover:bg-white/10"
                            )}
                          >
                            <span className="block font-semibold">{size.label}</span>
                            <span className="block text-xs text-white/50">×{size.multiplier.toFixed(1)} price</span>
                          </button>
                        );
                      })}
                    </div>
                  </label>
                )}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-white/60">Add-ons</h3>
              {addOns.length === 0 ? (
                <p className="text-sm text-white/60">No add-ons configured.</p>
              ) : (
                <div className="space-y-2">
                  {addOns.map((addOn) => {
                    const active = draft.addOnIds.includes(addOn.id);
                    return (
                      <label
                        key={addOn.id}
                        className={clsx(
                          "flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2 text-sm transition",
                          active
                            ? "border-brand-bubble/80 bg-brand-bubble/20 text-white"
                            : "border-white/15 bg-white/5 text-white/70 hover:border-white/25 hover:bg-white/10"
                        )}
                      >
                        <span className="font-medium">{addOn.name}</span>
                        <span className="flex items-center gap-2">
                          <span className="text-xs text-white/60">{currency.format(addOn.price)}</span>
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() => toggleAddOn(addOn.id)}
                            className="h-4 w-4 rounded border-white/30 bg-white/10 text-brand-bubble focus:ring-brand-bubble"
                          />
                        </span>
                      </label>
                    );
                  })}
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
                    Add-on total {currency.format(addOnTotal)}
                  </p>
                </div>
              )}
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-white/60">Pricing</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <label className="flex flex-col gap-1">
                  <span className="text-white/70">Discount</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="1"
                    value={draft.discount}
                    onChange={(event) => updateDraft("discount", Number(event.target.value) || 0)}
                    className="h-10 rounded-lg border border-white/20 bg-white/10 px-3 text-sm text-white focus:border-white/40 focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-white/70">Tax</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="1"
                    value={draft.tax}
                    onChange={(event) => updateDraft("tax", Number(event.target.value) || 0)}
                    className="h-10 rounded-lg border border-white/20 bg-white/10 px-3 text-sm text-white focus:border-white/40 focus:outline-none"
                  />
                </label>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
                <dl className="space-y-1 text-white/80">
                  <div className="flex justify-between">
                    <dt>Base price</dt>
                    <dd className="font-semibold text-white">{currency.format(basePrice)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Add-ons</dt>
                    <dd className="font-semibold text-white">{currency.format(addOnTotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Subtotal</dt>
                    <dd className="font-semibold text-white">{currency.format(subtotal)}</dd>
                  </div>
                  <div className="flex justify-between text-white/70">
                    <dt>Discount</dt>
                    <dd>-{currency.format(draft.discount)}</dd>
                  </div>
                  <div className="flex justify-between text-white/70">
                    <dt>Tax</dt>
                    <dd>{currency.format(draft.tax)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-2 text-sm font-semibold uppercase tracking-[0.2em] text-white">
                    <dt>Total</dt>
                    <dd>{currency.format(Math.max(total, 0))}</dd>
                  </div>
                </dl>
                <div className="mt-3 rounded-xl border border-dashed border-white/20 bg-white/5 p-3 text-xs text-white/60">
                  <p className="font-semibold uppercase tracking-[0.2em] text-white/70">Commission</p>
                  <p>Base: {currency.format(basePrice)}</p>
                  <p>Earned: {currency.format(Math.round(basePrice * 0.35))} (placeholder)</p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-white/60">Status</h3>
              <div className="grid grid-cols-2 gap-2">
                {statusOptions.map((status) => {
                  const isActive = draft.status === status;
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => updateDraft("status", status)}
                      className={clsx(
                        "rounded-xl border px-3 py-2 text-sm capitalize transition",
                        isActive
                          ? "border-brand-mint/60 bg-brand-mint/20 text-white"
                          : "border-white/15 bg-white/5 text-white/70 hover:border-white/25 hover:bg-white/10"
                      )}
                    >
                      {status.replace(/_/g, " ")}
                    </button>
                  );
                })}
              </div>
            </section>

            {showNotificationActions && (
              <section className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-white/60">
                  Client communications
                </h3>
                <div className="space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">Send reminder</p>
                        <p className="text-xs text-white/60">
                          Last sent {formatLastSent(lastSent.reminder)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleSendReminder}
                        disabled={isReminderLoading}
                        className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/80 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isReminderLoading ? "Sending…" : "Send reminder"}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">Mark ready for pickup</p>
                        <p className="text-xs text-white/60">
                          Last sent {formatLastSent(lastSent.pickup)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleSendPickup}
                        disabled={isPickupLoading}
                        className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/80 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isPickupLoading ? "Sending…" : "Mark ready"}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">Create reschedule link</p>
                        <p className="text-xs text-white/60">
                          Last created {formatLastSent(lastSent.reschedule)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleCreateReschedule}
                        disabled={isRescheduleLoading}
                        className="inline-flex items-center justify-center rounded-full border border-brand-bubble/60 bg-brand-bubble px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-900 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isRescheduleLoading ? "Creating…" : "Create link"}
                      </button>
                    </div>
                  </div>
                </div>
                {activityError && (
                  <p className="text-xs text-rose-300/80">{activityError}</p>
                )}
              </section>
            )}

            <section className="space-y-2">
              <label className="flex flex-col gap-1 text-sm text-white/70">
                <span>Notes</span>
                <textarea
                  rows={4}
                  value={draft.notes ?? ""}
                  onChange={(event) => updateDraft("notes", event.target.value)}
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white focus:border-white/40 focus:outline-none"
                  placeholder="Internal notes, grooming instructions, etc."
                />
              </label>
            </section>
          </div>
        </form>

        <div className="border-t border-white/10 bg-slate-950/70 px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className={clsx("flex items-center gap-2 rounded-xl px-3 py-2 text-sm", serviceClasses)}>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-xs font-semibold uppercase tracking-[0.25em]">
                {service?.name?.slice(0, 2) ?? "SV"}
              </span>
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-[0.3em] text-white/60">Service</span>
                <span className="text-sm font-semibold text-white">{service?.name ?? "Select service"}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {draft.id && onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete?.(draft.id!)}
                  className="rounded-full border border-red-400/40 bg-red-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-red-200 transition hover:bg-red-500/20"
                >
                  Delete
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/70 transition hover:bg-white/20"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                className="rounded-full border border-brand-bubble/60 bg-brand-bubble px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-900 transition hover:brightness-105"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
