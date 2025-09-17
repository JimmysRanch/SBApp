"use client";
import useSWR from "swr";
import { useCallback, useMemo } from "react";
import { fmt } from "../utils/date";
import type { TCalendarEvent } from "@/lib/validation/calendar";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  let json: any = null;
  try {
    json = await res.json();
  } catch (err) {
    // If parsing fails but the response was successful, bubble the original error.
    if (res.ok) throw err;
  }

  if (!res.ok) {
    const message =
      (json && typeof json === "object" && typeof json.error === "string" && json.error.trim())
        ? json.error
        : `Request failed with status ${res.status}`;
    const error = new Error(message);
    (error as any).status = res.status;
    (error as any).payload = json;
    throw error;
  }

  return json;
};

export type NewEvent = {
  title: string;
  type: "appointment" | "shift" | "timeOff";
  start: string | Date;
  end: string | Date;
  notes?: string | null;
  staffId?: number | null;
  petId?: string | null;
  allDay?: boolean;
};

export function useCalendarEvents(from: Date, to: Date, q?: { staffId?: number; type?: string }) {
  const params = new URLSearchParams();
  params.set("from", fmt(from)); params.set("to", fmt(to));
  if (q?.staffId !== undefined && Number.isFinite(q.staffId)) params.set("staffId", String(q.staffId));
  if (q?.type) params.set("type", q.type);

  const { data, error: swrError, isLoading, mutate, isValidating } = useSWR(`/api/calendar?${params.toString()}`, fetcher, {
    revalidateOnFocus: false,
  });
  const events = useMemo<TCalendarEvent[]>(() => data?.data ?? [], [data]);

  const error = useMemo(() => {
    if (!swrError) return undefined;
    if (swrError instanceof Error) return swrError;
    return new Error(String(swrError));
  }, [swrError]);

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
