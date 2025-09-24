import type { PostgrestError } from "@supabase/supabase-js";

export function isMissingColumnError(error: PostgrestError | null) {
  if (!error) return false;
  if (error.code === "42703") return true;
  return error.message?.toLowerCase().includes("column") && error.message?.toLowerCase().includes("does not exist");
}

export function isMissingRelationError(error: PostgrestError | null) {
  if (!error) return false;
  if (error.code === "42P01" || error.code === "PGRST205") return true;
  const message = error.message?.toLowerCase() ?? "";
  return (
    (message.includes("relation") || message.includes("table")) &&
    (message.includes("does not exist") || message.includes("schema cache"))
  );
}

export function isMissingFunctionError(error: PostgrestError | null) {
  if (!error) return false;
  if (error.code === "42883") return true;
  return error.message?.toLowerCase().includes("function") && error.message?.toLowerCase().includes("does not exist");
}

export function isPermissionError(error: PostgrestError | null) {
  if (!error) return false;
  if (error.code === "42501") return true;
  return error.message?.toLowerCase().includes("permission denied");
}

export function isMissingPrimaryKeyError(error: PostgrestError | null) {
  if (!error) return false;
  if (error.code === "PGRST301") return true;
  return error.message?.toLowerCase().includes("no suitable key");
}

export function isInvalidInputError(error: PostgrestError | null) {
  if (!error) return false;
  if (error.code === "22P02") return true;
  const message = error.message?.toLowerCase() ?? "";
  return message.includes("invalid input syntax") || message.includes("invalid input value");
}

export function shouldFallbackToAppointments(error: PostgrestError | null) {
  return isMissingFunctionError(error) || isMissingRelationError(error) || isPermissionError(error);
}

export function toNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function readMoney(record: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(record, key)) continue;
    const value = (record as Record<string, unknown>)[key];
    const numeric = toNumber(value);
    if (numeric === null) continue;
    if (key.endsWith("_cents")) {
      return numeric / 100;
    }
    return numeric;
  }
  return null;
}

export function parseDate(value: unknown) {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function computeDurationHours(startValue: unknown, endValue: unknown) {
  const start = parseDate(startValue);
  if (!start) return 0;
  const end = parseDate(endValue) ?? start;
  const diff = (end.getTime() - start.getTime()) / (60 * 60 * 1000);
  return diff > 0 ? diff : 0;
}

export function getUtcDayRange(base: Date) {
  const start = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()));
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

export function getUtcWeekRange(base: Date) {
  const day = base.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday as start of week
  const start = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()));
  start.setUTCDate(start.getUTCDate() + diff);
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  return { start, end };
}

export function computeBiweeklyWeekIndex(value: unknown): number | null {
  const date = parseDate(value);
  if (!date) return null;
  const startOfYear = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const diffDays = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.floor(diffDays / 7);
  return (weekNumber % 2) + 1;
}
