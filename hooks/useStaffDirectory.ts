"use client";

import { useMemo } from "react";
import useSWR from "swr";

export type StaffDirectoryEntry = {
  id: string;
  name: string;
  role: string | null;
  avatarUrl: string | null;
  active: boolean;
  profileId: string | null;
  initials: string;
  colorClass: string;
  description: string | null;
};

type FetchResult = {
  data?: Array<{
    id: number | string;
    name?: string | null;
    role?: string | null;
    avatarUrl?: string | null;
    active?: boolean | null;
    profileId?: string | null;
    specialties?: unknown;
  }>;
};

const STAFF_COLOR_CLASSES = [
  "bg-gradient-to-br from-amber-200/80 via-amber-300/70 to-amber-400/80 text-slate-900",
  "bg-gradient-to-br from-brand-bubble/80 via-brand-bubble/70 to-brand-lavender/80 text-slate-900",
  "bg-gradient-to-br from-emerald-300/80 via-emerald-400/70 to-emerald-500/80 text-slate-900",
  "bg-gradient-to-br from-sky-300/80 via-sky-400/70 to-sky-500/80 text-slate-900",
  "bg-gradient-to-br from-rose-300/80 via-rose-400/70 to-rose-500/80 text-slate-900",
  "bg-gradient-to-br from-indigo-300/80 via-indigo-400/70 to-indigo-500/80 text-slate-900",
];

const fetcher = async (url: string): Promise<FetchResult> => {
  const res = await fetch(url);
  let json: any = null;
  try {
    json = await res.json();
  } catch (err) {
    if (res.ok) {
      return {};
    }
    throw err;
  }

  if (!res.ok) {
    const message =
      json && typeof json === "object" && typeof json.error === "string" && json.error.trim()
        ? json.error
        : `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  return json;
};

function initialsFromName(name: string) {
  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return "--";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

function formatList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0]!;
  if (typeof Intl !== "undefined" && typeof Intl.ListFormat !== "undefined") {
    return new Intl.ListFormat(undefined, { style: "long", type: "conjunction" }).format(items);
  }
  const [last, ...rest] = items.slice().reverse();
  return `${rest.reverse().join(", ")} and ${last}`;
}

function buildDescription(value: unknown): string | null {
  if (!Array.isArray(value)) return null;
  const items = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
  if (items.length === 0) return null;
  return `Specialises in ${formatList(items)}`;
}

export function useStaffDirectory(options?: { includeInactive?: boolean }) {
  const params = new URLSearchParams();
  if (options?.includeInactive) {
    params.set("include_inactive", "1");
  }
  const query = params.toString();
  const key = `/api/staff${query ? `?${query}` : ""}`;

  const { data, error, isLoading, mutate } = useSWR<FetchResult>(key, fetcher, {
    revalidateOnFocus: false,
  });

  const staff = useMemo<StaffDirectoryEntry[]>(() => {
    const rows = Array.isArray(data?.data) ? data!.data! : [];
    return rows.map((row, index) => {
      const name = typeof row.name === "string" && row.name.trim().length > 0 ? row.name.trim() : "Staff member";
      const avatar = typeof row.avatarUrl === "string" && row.avatarUrl.trim().length > 0 ? row.avatarUrl.trim() : null;
      const profileId = typeof row.profileId === "string" && row.profileId.trim().length > 0 ? row.profileId.trim() : null;
      const description = buildDescription(row.specialties);
      const active = row.active !== false;
      return {
        id: String(row.id),
        name,
        role: typeof row.role === "string" && row.role.trim().length > 0 ? row.role : null,
        avatarUrl: avatar,
        active,
        profileId,
        initials: initialsFromName(name),
        colorClass: STAFF_COLOR_CLASSES[index % STAFF_COLOR_CLASSES.length],
        description,
      };
    });
  }, [data]);

  const activeStaff = useMemo(() => staff.filter((member) => member.active), [staff]);

  const errorObject = useMemo(() => {
    if (!error) return null;
    if (error instanceof Error) return error;
    return new Error(String(error));
  }, [error]);

  return {
    staff,
    activeStaff,
    isLoading,
    error: errorObject,
    refresh: mutate,
  };
}

export default useStaffDirectory;
