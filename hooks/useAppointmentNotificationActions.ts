"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { fetchLatestAuditTimestamp, type AuditLogAction } from "@/lib/audit-log";

type ActionKey = "reminder" | "pickup" | "reschedule";

type ActionResult = {
  ok: boolean;
  message?: string;
  url?: string;
  copied?: boolean;
};

type LastSentState = Record<ActionKey, Date | null>;

const AUDIT_ACTIONS: Record<ActionKey, AuditLogAction> = {
  reminder: "appointment_reminder_queued",
  pickup: "appointment_pickup_ready",
  reschedule: "appointment_reschedule_link_created",
};

const INITIAL_TIMESTAMPS: LastSentState = {
  reminder: null,
  pickup: null,
  reschedule: null,
};

async function parseResponse(response: Response) {
  const text = await response.text();
  if (!text) {
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    return {};
  }

  try {
    const json = JSON.parse(text);
    if (!response.ok) {
      const message = typeof json?.error === "string" ? json.error : undefined;
      throw new Error(message ?? `Request failed with status ${response.status}`);
    }
    return json;
  } catch (error) {
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    throw error;
  }
}

export function useAppointmentNotificationActions(appointmentId: string | null) {
  const [loadingAction, setLoadingAction] = useState<ActionKey | null>(null);
  const [lastSent, setLastSent] = useState<LastSentState>(INITIAL_TIMESTAMPS);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const canQuery = useMemo(() => Boolean(appointmentId), [appointmentId]);

  const refreshTimestamps = useCallback(async () => {
    if (!appointmentId) {
      setLastSent(INITIAL_TIMESTAMPS);
      setFetchError(null);
      return;
    }

    setFetching(true);
    try {
      const [reminder, pickup, reschedule] = await Promise.all([
        fetchLatestAuditTimestamp(appointmentId, AUDIT_ACTIONS.reminder).catch(() => null),
        fetchLatestAuditTimestamp(appointmentId, AUDIT_ACTIONS.pickup).catch(() => null),
        fetchLatestAuditTimestamp(appointmentId, AUDIT_ACTIONS.reschedule).catch(() => null),
      ]);
      setLastSent({ reminder, pickup, reschedule });
      setFetchError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load activity";
      setFetchError(message);
    } finally {
      setFetching(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    if (!canQuery) {
      setLastSent(INITIAL_TIMESTAMPS);
      setFetchError(null);
      return;
    }
    void refreshTimestamps();
  }, [canQuery, refreshTimestamps]);

  const sendReminder = useCallback(async (): Promise<ActionResult> => {
    if (!appointmentId) {
      return { ok: false, message: "Appointment is not saved yet" };
    }
    setLoadingAction("reminder");
    try {
      const response = await fetch("/api/notifications/send-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId }),
      });
      await parseResponse(response);
      await refreshTimestamps();
      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send reminder";
      return { ok: false, message };
    } finally {
      setLoadingAction((current) => (current === "reminder" ? null : current));
    }
  }, [appointmentId, refreshTimestamps]);

  const sendPickupReady = useCallback(async (): Promise<ActionResult> => {
    if (!appointmentId) {
      return { ok: false, message: "Appointment is not saved yet" };
    }
    setLoadingAction("pickup");
    try {
      const response = await fetch("/api/notifications/send-pickup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId }),
      });
      await parseResponse(response);
      await refreshTimestamps();
      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send pickup alert";
      return { ok: false, message };
    } finally {
      setLoadingAction((current) => (current === "pickup" ? null : current));
    }
  }, [appointmentId, refreshTimestamps]);

  const createReschedule = useCallback(async (): Promise<ActionResult> => {
    if (!appointmentId) {
      return { ok: false, message: "Appointment is not saved yet" };
    }
    setLoadingAction("reschedule");
    try {
      const response = await fetch("/api/appointments/reschedule-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId }),
      });
      const json = await parseResponse(response);
      const url: string | undefined = json?.data?.url ?? json?.url;
      let copied = false;
      if (url && typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(url);
          copied = true;
        } catch (error) {
          copied = false;
        }
      }
      await refreshTimestamps();
      return { ok: true, url, copied, message: copied ? undefined : url ? "Copy to clipboard failed" : undefined };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create reschedule link";
      return { ok: false, message };
    } finally {
      setLoadingAction((current) => (current === "reschedule" ? null : current));
    }
  }, [appointmentId, refreshTimestamps]);

  return {
    lastSent,
    loadingAction,
    fetching,
    fetchError,
    refreshTimestamps,
    sendReminder,
    sendPickupReady,
    createReschedule,
  };
}
