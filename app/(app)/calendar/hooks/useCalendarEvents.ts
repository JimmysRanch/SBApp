"use client";
import useSWR from "swr";
import { useCallback, useMemo } from "react";
import { fmt } from "../utils/date";
import type { TCalendarEvent } from "@/lib/validation/calendar";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export type NewEvent = {
  title: string;
  type: "appointment" | "shift" | "timeOff";
  start: string | Date;
  end: string | Date;
  notes?: string | null;
  staffId?: string | null;
  petId?: string | null;
  allDay?: boolean;
};

export function useCalendarEvents(from: Date, to: Date, q?: { staffId?: string; type?: string }) {
  const params = new URLSearchParams();
  params.set("from", fmt(from)); params.set("to", fmt(to));
  if (q?.staffId) params.set("staffId", q.staffId);
  if (q?.type) params.set("type", q.type);

  const { data, error, isLoading, mutate, isValidating } = useSWR(`/api/calendar?${params.toString()}`, fetcher, {
    revalidateOnFocus: false,
  });
  const events = useMemo<TCalendarEvent[]>(() => data?.data ?? [], [data]);

  const create = useCallback(async (payload: NewEvent) => {
    const res = await fetch("/api/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "create failed");
    mutate();
    return json.data;
  }, [mutate]);

  const update = useCallback(async (id: string, patch: Partial<NewEvent>) => {
    const res = await fetch(`/api/calendar/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "update failed");
    mutate();
    return json.data;
  }, [mutate]);

  const remove = useCallback(async (id: string) => {
    const res = await fetch(`/api/calendar/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "delete failed");
    mutate();
    return true;
  }, [mutate]);

  const refresh = useCallback(() => mutate(), [mutate]);

  return { events, error, isLoading: isLoading || isValidating, create, update, remove, refresh };
}
