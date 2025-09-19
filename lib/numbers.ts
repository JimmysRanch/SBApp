export function parseNumeric(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function parseCurrency(primary: unknown, centsValue?: unknown): number | null {
  const direct = parseNumeric(primary);
  if (direct !== null) {
    return direct;
  }
  const cents = parseNumeric(centsValue);
  if (cents !== null) {
    return cents / 100;
  }
  return null;
}
