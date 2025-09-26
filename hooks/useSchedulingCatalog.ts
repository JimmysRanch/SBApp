"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase/client";

export type CatalogStaff = {
  id: string;
  name: string;
  role: string | null;
  avatarUrl: string | null;
  bio: string | null;
  initials: string;
  colorClass: string;
  employeeId: number | null;
  active: boolean;
};

export type CatalogServiceSize = { id: string; label: string; multiplier: number };

export type CatalogService = {
  id: string;
  name: string;
  basePrice: number;
  duration: number;
  colorClass: string;
  sizes: CatalogServiceSize[];
};

export type CatalogAddOn = { id: string; name: string; price: number };

export type CatalogPet = { id: string; name: string; breed: string | null };

type StaffRow = {
  id: number;
  user_id?: string | null;
  name?: string | null;
  role?: string | null;
  avatar_url?: string | null;
  manager_notes?: string | null;
  active?: boolean | null;
  status?: string | null;
};

type ServiceRow = {
  id: string;
  name?: string | null;
  base_price?: number | string | null;
  duration_min?: number | string | null;
};

type AddOnRow = {
  id: string;
  name?: string | null;
  price?: number | string | null;
};

type PetRow = {
  id: string;
  name?: string | null;
  breed?: string | null;
};

const staffColors = [
  "bg-gradient-to-br from-brand-bubble/80 via-brand-bubble/60 to-brand-lavender/70 text-slate-900",
  "bg-gradient-to-br from-emerald-300/80 via-emerald-400/60 to-emerald-500/70 text-slate-900",
  "bg-gradient-to-br from-amber-200/80 via-amber-300/60 to-amber-400/70 text-slate-900",
  "bg-gradient-to-br from-sky-300/80 via-sky-400/60 to-sky-500/70 text-slate-900",
  "bg-gradient-to-br from-rose-300/80 via-rose-400/60 to-rose-500/70 text-slate-900",
] as const;

const serviceColors = [
  "bg-gradient-to-r from-brand-bubble/40 via-brand-bubble/25 to-transparent text-white",
  "bg-gradient-to-r from-sky-400/40 via-sky-400/20 to-transparent text-white",
  "bg-gradient-to-r from-amber-400/50 via-amber-400/25 to-transparent text-white",
  "bg-gradient-to-r from-emerald-400/45 via-emerald-400/20 to-transparent text-white",
  "bg-gradient-to-r from-rose-400/45 via-rose-400/20 to-transparent text-white",
] as const;

function pickColor(palette: readonly string[], index: number): string {
  return palette[index % palette.length];
}

function normaliseNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function normaliseName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function computeInitials(name: string | null): string {
  if (!name) return "SB";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  if (parts.length === 0) return "SB";
  return parts
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
    .padEnd(2, "B");
}

function buildDefaultSizes(serviceId: string): CatalogServiceSize[] {
  return [
    {
      id: `${serviceId}-standard`,
      label: "Standard",
      multiplier: 1,
    },
  ];
}

function mapStaffRows(rows: StaffRow[]): CatalogStaff[] {
  return rows
    .map((row, index) => {
      const id = typeof row.user_id === "string" && row.user_id.trim().length > 0
        ? row.user_id.trim()
        : `employee-${row.id}`;
      const name = normaliseName(row.name) ?? "Staff member";
      const status = typeof row.status === "string" ? row.status.toLowerCase() : "";
      const isActive = row.active !== false && !status.includes("inactive");
      return {
        id,
        name,
        role: normaliseName(row.role),
        avatarUrl: normaliseName(row.avatar_url),
        bio: normaliseName(row.manager_notes),
        initials: computeInitials(name),
        colorClass: pickColor(staffColors, index),
        employeeId: Number.isFinite(row.id) ? row.id : null,
        active: isActive,
      } satisfies CatalogStaff;
    })
    .filter((staff) => staff.active);
}

function mapServiceRows(rows: ServiceRow[]): CatalogService[] {
  return rows
    .map((row, index) => {
      if (!row.id) return null;
      const id = row.id;
      const name = normaliseName(row.name) ?? "Service";
      const basePrice = normaliseNumber(row.base_price);
      const duration = normaliseNumber(row.duration_min) || 60;
      return {
        id,
        name,
        basePrice,
        duration,
        colorClass: pickColor(serviceColors, index),
        sizes: buildDefaultSizes(id),
      } satisfies CatalogService;
    })
    .filter((service): service is CatalogService => service !== null);
}

function mapAddOnRows(rows: AddOnRow[]): CatalogAddOn[] {
  return rows
    .map((row) => {
      if (!row.id) return null;
      return {
        id: row.id,
        name: normaliseName(row.name) ?? "Add-on",
        price: normaliseNumber(row.price),
      } satisfies CatalogAddOn;
    })
    .filter((addOn): addOn is CatalogAddOn => addOn !== null);
}

function mapPetRows(rows: PetRow[]): CatalogPet[] {
  return rows
    .map((row) => {
      if (!row.id) return null;
      return {
        id: row.id,
        name: normaliseName(row.name) ?? "Pet",
        breed: normaliseName(row.breed),
      } satisfies CatalogPet;
    })
    .filter((pet): pet is CatalogPet => pet !== null);
}

export function useSchedulingCatalog(clientId?: string | null) {
  const [staff, setStaff] = useState<CatalogStaff[]>([]);
  const [services, setServices] = useState<CatalogService[]>([]);
  const [addOns, setAddOns] = useState<CatalogAddOn[]>([]);
  const [pets, setPets] = useState<CatalogPet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    const staffPromise = supabase
      .from("employees")
      .select("id, user_id, name, role, avatar_url, manager_notes, active, status")
      .order("name", { ascending: true });

    const servicesPromise = supabase
      .from("services")
      .select("id, name, base_price, duration_min")
      .order("name", { ascending: true });

    const addOnsPromise = supabase
      .from("add_ons")
      .select("id, name, price")
      .order("name", { ascending: true });

    const petsPromise = clientId
      ? supabase
          .from("pets")
          .select("id, name, breed")
          .eq("client_id", clientId)
          .order("name", { ascending: true })
      : Promise.resolve({ data: [] as PetRow[], error: null });

    const [staffResult, serviceResult, addOnResult, petResult] = await Promise.allSettled([
      staffPromise,
      servicesPromise,
      addOnsPromise,
      petsPromise,
    ]);

    let fatalError: string | null = null;

    if (staffResult.status === "fulfilled") {
      if (staffResult.value.error) {
        console.error("Failed to load staff", staffResult.value.error);
        fatalError = "We couldn’t load the staff list.";
        setStaff([]);
      } else {
        setStaff(mapStaffRows((staffResult.value.data as StaffRow[]) ?? []));
      }
    } else {
      console.error("Failed to load staff", staffResult.reason);
      fatalError = "We couldn’t load the staff list.";
      setStaff([]);
    }

    if (serviceResult.status === "fulfilled") {
      if (serviceResult.value.error) {
        console.error("Failed to load services", serviceResult.value.error);
        fatalError = fatalError ?? "We couldn’t load services.";
        setServices([]);
      } else {
        setServices(mapServiceRows((serviceResult.value.data as ServiceRow[]) ?? []));
      }
    } else {
      console.error("Failed to load services", serviceResult.reason);
      fatalError = fatalError ?? "We couldn’t load services.";
      setServices([]);
    }

    if (addOnResult.status === "fulfilled") {
      if (addOnResult.value.error) {
        console.warn("Failed to load add-ons", addOnResult.value.error);
        setAddOns([]);
      } else {
        setAddOns(mapAddOnRows((addOnResult.value.data as AddOnRow[]) ?? []));
      }
    } else {
      console.warn("Failed to load add-ons", addOnResult.reason);
      setAddOns([]);
    }

    if (petResult.status === "fulfilled") {
      if (petResult.value.error) {
        console.warn("Failed to load pets", petResult.value.error);
        setPets([]);
      } else {
        setPets(mapPetRows((petResult.value.data as PetRow[]) ?? []));
      }
    } else {
      console.warn("Failed to load pets", petResult.reason);
      setPets([]);
    }

    setError(fatalError);
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const catalog = useMemo(
    () => ({ staff, services, addOns, pets, loading, error, refresh }),
    [staff, services, addOns, pets, loading, error, refresh]
  );

  return catalog;
}
