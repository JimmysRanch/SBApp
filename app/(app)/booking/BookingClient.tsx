"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";

import { useAuth } from "@/components/AuthProvider";
import { canAccessRoute } from "@/lib/auth/access";
import { toLegacyRole } from "@/lib/auth/roles";
import {
  addOnCatalog,
  serviceCatalog,
  staffDirectory as staffProfiles,
} from "@/lib/data/catalog";

const currency = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

type StaffOption = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  bio: string;
};

type ServiceOption = {
  id: string;
  name: string;
  duration: number;
  basePrice: number;
  sizes: { id: string; label: string; multiplier: number }[];
};

type SlotOption = {
  id: string;
  label: string;
  start: string;
  end: string;
};

const staffOptions: StaffOption[] = staffProfiles.map(
  ({ id, name, role, avatar, bio }) => ({ id, name, role, avatar, bio })
);

const slotOptions: SlotOption[] = [
  { id: "slot-9", label: "Today · 9:00am", start: "2024-04-05T09:00:00", end: "2024-04-05T10:30:00" },
  { id: "slot-11", label: "Today · 11:30am", start: "2024-04-05T11:30:00", end: "2024-04-05T13:00:00" },
  { id: "slot-14", label: "Tomorrow · 2:00pm", start: "2024-04-06T14:00:00", end: "2024-04-06T15:30:00" },
  { id: "slot-16", label: "Saturday · 4:00pm", start: "2024-04-07T16:00:00", end: "2024-04-07T17:30:00" },
];

const serviceOptions: ServiceOption[] = serviceCatalog.map(
  ({ id, name, duration, basePrice, sizes }) => ({
    id,
    name,
    duration,
    basePrice,
    sizes,
  })
);

const addOns = addOnCatalog;

const pets = [
  { id: "pet-1", name: "Mocha", breed: "Cockapoo" },
  { id: "pet-2", name: "Nova", breed: "Husky" },
  { id: "pet-3", name: "Frodo", breed: "Mini Labradoodle" },
];

const steps = [
  { id: "staff", label: "Choose staff" },
  { id: "slot", label: "Select slot" },
  { id: "pet", label: "Select pet" },
  { id: "service", label: "Service & size" },
  { id: "addons", label: "Add-ons" },
  { id: "summary", label: "Price summary" },
  { id: "confirm", label: "Confirm" },
] as const;

type BookingDraft = {
  staffId: string | null;
  slotId: string | null;
  petId: string | null;
  serviceId: string | null;
  sizeId: string | null;
  addOnIds: string[];
  discount: number;
  tax: number;
  confirmed: boolean;
};

const defaultDraft: BookingDraft = {
  staffId: null,
  slotId: null,
  petId: null,
  serviceId: null,
  sizeId: null,
  addOnIds: [],
  discount: 0,
  tax: 8,
  confirmed: false,
};

export default function BookingClient() {
  const { loading, role } = useAuth();
  const legacyRole = useMemo(() => toLegacyRole(role), [role]);
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId") ?? null;

  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [draft, setDraft] = useState<BookingDraft>(defaultDraft);
  const [showCelebration, setShowCelebration] = useState(false);

  const activeStep = steps[activeStepIndex];
  const selectedStaff = useMemo(
    () => staffOptions.find((staff) => staff.id === draft.staffId) ?? null,
    [draft.staffId]
  );
  const selectedSlot = useMemo(
    () => slotOptions.find((slot) => slot.id === draft.slotId) ?? null,
    [draft.slotId]
  );
  const selectedService = useMemo(
    () => serviceOptions.find((service) => service.id === draft.serviceId) ?? null,
    [draft.serviceId]
  );
  const selectedSize = useMemo(() => {
    if (!selectedService || !draft.sizeId) return null;
    return selectedService.sizes.find((size) => size.id === draft.sizeId) ?? null;
  }, [draft.sizeId, selectedService]);
  const selectedPet = useMemo(
    () => pets.find((pet) => pet.id === draft.petId) ?? null,
    [draft.petId]
  );

  const basePrice = useMemo(() => {
    if (!selectedService || !selectedSize) return 0;
    return Math.round(selectedService.basePrice * selectedSize.multiplier);
  }, [selectedService, selectedSize]);

  const addOnTotal = useMemo(
    () =>
      draft.addOnIds.reduce((total, id) => {
        const addOn = addOns.find((item) => item.id === id);
        return total + (addOn?.price ?? 0);
      }, 0),
    [draft.addOnIds]
  );

  const subtotal = basePrice + addOnTotal;
  const total = subtotal - draft.discount + draft.tax;

  const canContinue = useMemo(() => {
    switch (activeStep.id) {
      case "staff":
        return draft.staffId !== null;
      case "slot":
        return draft.slotId !== null;
      case "pet":
        return draft.petId !== null;
      case "service":
        return draft.serviceId !== null && draft.sizeId !== null;
      case "addons":
        return true;
      case "summary":
        return true;
      case "confirm":
        return !draft.confirmed;
    }
  }, [activeStep.id, draft]);

  function goNext() {
    setActiveStepIndex((index) => Math.min(index + 1, steps.length - 1));
  }

  function goBack() {
    setActiveStepIndex((index) => Math.max(index - 1, 0));
  }

  function toggleAddOn(id: string) {
    setDraft((prev) => {
      const exists = prev.addOnIds.includes(id);
      return {
        ...prev,
        addOnIds: exists ? prev.addOnIds.filter((item) => item !== id) : [...prev.addOnIds, id],
      };
    });
  }

  function confirmBooking() {
    setDraft((prev) => ({ ...prev, confirmed: true }));
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 3200);
  }

  if (loading) {
    return <div className="px-6 py-10 text-sm text-white/70">Loading booking flow…</div>;
  }

  if (!legacyRole || !canAccessRoute(legacyRole, "booking")) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-white/80">
        <h1 className="text-2xl font-semibold text-white">Booking unavailable</h1>
        <p className="mt-3 text-sm">
          Your role does not allow access to the booking flow. Front desk, managers and administrators can book
          appointments on behalf of clients.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-8 text-white">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">New appointment</p>
          <h1 className="text-3xl font-semibold">Guided booking</h1>
          {clientId && (
            <p className="mt-1 text-sm text-white/70">
              Booking for client <span className="font-semibold text-white">#{clientId}</span>
            </p>
          )}
        </div>
        <Link
          href="/calendar"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/80 transition hover:border-white/30 hover:text-white"
        >
          View calendar
        </Link>
      </header>

      <ol className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.35em] text-white/60">
        {steps.map((step, index) => {
          const isComplete = index < activeStepIndex;
          const isActive = index === activeStepIndex;
          return (
            <li key={step.id} className="flex items-center gap-2">
              <span
                className={clsx(
                  "grid h-8 w-8 place-items-center rounded-full border text-xs font-semibold",
                  isActive
                    ? "border-white bg-white text-slate-900"
                    : isComplete
                    ? "border-brand-bubble/80 bg-brand-bubble/20 text-white"
                    : "border-white/20 bg-white/5 text-white/60"
                )}
              >
                {index + 1}
              </span>
              <span className={clsx("font-semibold", isActive ? "text-white" : "text-white/70")}>{step.label}</span>
              {index < steps.length - 1 && <span className="text-white/20">·</span>}
            </li>
          );
        })}
      </ol>

      <section className="rounded-3xl border border-white/15 bg-white/5 p-6">
        {activeStep.id === "staff" && (
          <div className="grid gap-4 md:grid-cols-3">
            {staffOptions.map((staff) => {
              const active = staff.id === draft.staffId;
              return (
                <button
                  key={staff.id}
                  type="button"
                  onClick={() => setDraft((prev) => ({ ...prev, staffId: staff.id }))}
                  className={clsx(
                    "flex h-full flex-col gap-3 rounded-2xl border p-4 text-left transition",
                    active
                      ? "border-white/70 bg-white/20 text-white shadow-lg shadow-black/30"
                      : "border-white/10 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/10"
                  )}
                >
                  <Image
                    src={staff.avatar}
                    alt={staff.name}
                    width={56}
                    height={56}
                    unoptimized
                    className="h-14 w-14 rounded-full border border-white/20 bg-white/20 object-cover"
                  />
                  <div>
                    <h2 className="text-lg font-semibold text-white">{staff.name}</h2>
                    <p className="text-xs uppercase tracking-[0.35em] text-white/50">{staff.role}</p>
                  </div>
                  <p className="text-sm leading-relaxed text-white/70">{staff.bio}</p>
                </button>
              );
            })}
          </div>
        )}

        {activeStep.id === "slot" && (
          <div className="space-y-4">
            <p className="text-sm text-white/70">
              Availability shown for <span className="font-semibold text-white">{selectedStaff?.name ?? "staff"}</span>
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {slotOptions.map((slot) => {
                const active = slot.id === draft.slotId;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, slotId: slot.id }))}
                    className={clsx(
                      "rounded-2xl border px-4 py-3 text-left transition",
                      active
                        ? "border-brand-mint/70 bg-brand-mint/20 text-white shadow-lg shadow-black/30"
                        : "border-white/10 bg-white/5 text-white/70 hover:border-white/25 hover:bg-white/10"
                    )}
                  >
                    <p className="text-sm font-semibold text-white">{slot.label}</p>
                    <p className="text-xs text-white/60">{new Date(slot.start).toLocaleString()}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeStep.id === "pet" && (
          <div className="grid gap-4 sm:grid-cols-3">
            {pets.map((pet) => {
              const active = pet.id === draft.petId;
              return (
                <button
                  key={pet.id}
                  type="button"
                  onClick={() => setDraft((prev) => ({ ...prev, petId: pet.id }))}
                  className={clsx(
                    "flex h-full flex-col justify-between rounded-2xl border p-4 text-left transition",
                    active
                      ? "border-brand-bubble/70 bg-brand-bubble/20 text-white"
                      : "border-white/10 bg-white/5 text-white/70 hover:border-white/25 hover:bg-white/10"
                  )}
                >
                  <div>
                    <h3 className="text-lg font-semibold text-white">{pet.name}</h3>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/60">{pet.breed}</p>
                  </div>
                  <p className="mt-4 text-xs text-white/50">Tap to assign appointment</p>
                </button>
              );
            })}
            <button
              type="button"
              className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/30 bg-white/5 p-4 text-center text-sm text-white/60 transition hover:border-white/50 hover:text-white"
            >
              <span className="text-2xl">+</span>
              Add new pet
            </button>
          </div>
        )}

        {activeStep.id === "service" && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              {serviceOptions.map((service) => {
                const active = service.id === draft.serviceId;
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        serviceId: service.id,
                        sizeId: service.sizes[0].id,
                      }))
                    }
                    className={clsx(
                      "flex h-full flex-col rounded-2xl border p-4 text-left transition",
                      active
                        ? "border-white/70 bg-white/20 text-white"
                        : "border-white/10 bg-white/5 text-white/70 hover:border-white/25 hover:bg-white/10"
                    )}
                  >
                    <h3 className="text-lg font-semibold text-white">{service.name}</h3>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                      {service.duration} min · {currency.format(service.basePrice)} base
                    </p>
                    <p className="mt-3 text-xs text-white/60">
                      Choose a size to apply multipliers and adjust pricing.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {service.sizes.map((size) => {
                        const activeSize = size.id === draft.sizeId;
                        return (
                          <button
                            key={size.id}
                            type="button"
                            onClick={() =>
                              setDraft((prev) => ({
                                ...prev,
                                serviceId: service.id,
                                sizeId: size.id,
                              }))
                            }
                            className={clsx(
                              "rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] transition",
                              activeSize
                                ? "border-white bg-white text-slate-900"
                                : "border-white/20 text-white/70 hover:border-white/40"
                            )}
                          >
                            {size.label}
                          </button>
                        );
                      })}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">Add-ons</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {addOns.map((addOn) => {
                  const activeAddOn = draft.addOnIds.includes(addOn.id);
                  return (
                    <button
                      key={addOn.id}
                      type="button"
                      onClick={() => toggleAddOn(addOn.id)}
                      className={clsx(
                        "rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] transition",
                        activeAddOn
                          ? "border-brand-bubble/70 bg-brand-bubble/20 text-white"
                          : "border-white/20 text-white/70 hover:border-white/40"
                      )}
                    >
                      {addOn.name} · {currency.format(addOn.price)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">Summary</h3>
                <dl className="mt-3 space-y-2 text-sm text-white/80">
                  <div className="flex justify-between">
                    <dt>Staff</dt>
                    <dd className="text-white">{selectedStaff?.name ?? "—"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Slot</dt>
                    <dd className="text-white">{selectedSlot?.label ?? "—"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Pet</dt>
                    <dd className="text-white">{selectedPet?.name ?? "—"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Service</dt>
                    <dd className="text-white">{selectedService?.name ?? "—"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Size</dt>
                    <dd className="text-white">{selectedSize?.label ?? "—"}</dd>
                  </div>
                </dl>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">Pricing</h3>
                <dl className="mt-3 space-y-2 text-sm text-white/80">
                  <div className="flex justify-between">
                    <dt>Base</dt>
                    <dd className="text-white">{currency.format(basePrice)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Add-ons</dt>
                    <dd className="text-white">{currency.format(addOnTotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Subtotal</dt>
                    <dd className="text-white">{currency.format(subtotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Discount</dt>
                    <dd>-{currency.format(draft.discount)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Tax</dt>
                    <dd>{currency.format(draft.tax)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-white/20 pt-3 text-sm font-semibold uppercase tracking-[0.3em] text-white">
                    <dt>Total</dt>
                    <dd>{currency.format(Math.max(total, 0))}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        )}

        {activeStep.id === "summary" && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">Appointment details</h3>
              <dl className="mt-3 space-y-2 text-sm text-white/80">
                <div className="flex justify-between">
                  <dt>Staff</dt>
                  <dd className="text-white">{selectedStaff?.name ?? "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Slot</dt>
                  <dd className="text-white">{selectedSlot?.label ?? "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Pet</dt>
                  <dd className="text-white">{selectedPet?.name ?? "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Service</dt>
                  <dd className="text-white">{selectedService?.name ?? "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Size</dt>
                  <dd className="text-white">{selectedSize?.label ?? "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Add-ons</dt>
                  <dd className="text-white">
                    {draft.addOnIds.length > 0 ? draft.addOnIds.length : "None"}
                  </dd>
                </div>
              </dl>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">Pricing</h3>
              <dl className="mt-3 space-y-2 text-sm text-white/80">
                <div className="flex justify-between">
                  <dt>Base</dt>
                  <dd className="text-white">{currency.format(basePrice)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Add-ons</dt>
                  <dd className="text-white">{currency.format(addOnTotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Subtotal</dt>
                  <dd className="text-white">{currency.format(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Discount</dt>
                  <dd>-{currency.format(draft.discount)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Tax</dt>
                  <dd>{currency.format(draft.tax)}</dd>
                </div>
                <div className="flex justify-between border-t border-white/20 pt-3 text-sm font-semibold uppercase tracking-[0.3em] text-white">
                  <dt>Total</dt>
                  <dd>{currency.format(Math.max(total, 0))}</dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {activeStep.id === "confirm" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm text-white/80">
              <p className="font-semibold uppercase tracking-[0.3em] text-white/60">Review</p>
              <p className="mt-2 text-lg font-semibold text-white">
                {selectedPet?.name ?? "Pet"} · {selectedService?.name ?? "Service"}
              </p>
              <p>{selectedStaff?.name ?? "Staff"} on {selectedSlot?.label ?? "selected time"}</p>
            </div>
            <button
              type="button"
              onClick={confirmBooking}
              disabled={draft.confirmed}
              className={clsx(
                "w-full rounded-full border border-brand-bubble/80 bg-brand-bubble px-5 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-slate-900 transition",
                draft.confirmed ? "opacity-60" : "hover:brightness-105"
              )}
            >
              {draft.confirmed ? "Appointment booked" : "Confirm appointment"}
            </button>
            {draft.confirmed && (
              <p className="text-center text-sm text-brand-mint">Confirmation email sent to client.</p>
            )}
          </div>
        )}
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={goBack}
          disabled={activeStepIndex === 0}
          className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:border-white/30 hover:text-white disabled:opacity-40"
        >
          Back
        </button>
        <div className="flex items-center gap-3">
          {activeStep.id === "summary" && (
            <div className="text-right text-sm">
              <p className="text-white/60">Estimated total</p>
              <p className="text-lg font-semibold text-white">{currency.format(Math.max(total, 0))}</p>
            </div>
          )}
          {activeStep.id !== "confirm" && (
            <button
              type="button"
              onClick={goNext}
              disabled={!canContinue}
              className="rounded-full border border-white/70 bg-white px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-900 transition hover:brightness-105 disabled:opacity-40"
            >
              Next
            </button>
          )}
        </div>
      </footer>

      {showCelebration && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur">
          <div className="rounded-3xl border border-brand-bubble/60 bg-white p-8 text-center text-slate-900 shadow-2xl">
            <p className="text-sm uppercase tracking-[0.35em] text-brand-bubble">Booked!</p>
            <h2 className="mt-3 text-2xl font-semibold">Appointment confirmed</h2>
            <p className="mt-2 text-sm text-slate-600">
              We blocked the slot, updated staff availability and sent confirmations.
            </p>
            <button
              type="button"
              onClick={() => setShowCelebration(false)}
              className="mt-6 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
