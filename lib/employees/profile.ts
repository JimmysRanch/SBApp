export const STAFF_STATUS_LABELS = ["Active", "Inactive", "On leave"] as const;

export type StaffStatus = (typeof STAFF_STATUS_LABELS)[number];

const STATUS_LOOKUP = new Map<string, StaffStatus>(
  STAFF_STATUS_LABELS.map((label) => [label.toLowerCase(), label]),
);

function normaliseStatusText(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function normalizeStatusLabel(
  rawStatus: string | null | undefined,
): { status: StaffStatus; isActive: boolean } {
  const text = typeof rawStatus === "string" ? rawStatus : "";
  const normalized = normaliseStatusText(text);
  if (!normalized) {
    return { status: "Active", isActive: true };
  }

  const exactMatch = STATUS_LOOKUP.get(normalized);
  if (exactMatch) {
    return { status: exactMatch, isActive: exactMatch === "Active" };
  }

  if (normalized.includes("leave")) {
    return { status: "On leave", isActive: false };
  }

  if (normalized.includes("inactive")) {
    return { status: "Inactive", isActive: false };
  }

  if (normalized.includes("active")) {
    return { status: "Active", isActive: true };
  }

  return { status: "Active", isActive: true };
}

export function cleanNullableText(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function normalizeTagList(values: string[] | null | undefined): string[] {
  if (!Array.isArray(values)) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result;
}

export function toOptionalNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const numeric = Number(trimmed);
    return Number.isFinite(numeric) ? numeric : null;
  }
  return null;
}
