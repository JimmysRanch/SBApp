export type EmployeeProfile = {
  id: number | null;
  name: string | null;
  role: string | null;
  app_permissions: Record<string, unknown> | null;
};

type RawEmployeeRow = {
  id?: number | string | null;
  name?: string | null;
  role?: string | null;
  app_permissions?: unknown;
};

export function normaliseRole(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function normaliseName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function mapEmployeeRowToProfile(row: RawEmployeeRow | null | undefined): EmployeeProfile | null {
  if (!row) return null;

  const idValue = typeof row.id === "number" ? row.id : Number(row.id);

  return {
    id: Number.isFinite(idValue) ? idValue : null,
    name: normaliseName(row.name),
    role: normaliseRole(row.role),
    app_permissions:
      row.app_permissions && typeof row.app_permissions === "object"
        ? (row.app_permissions as Record<string, unknown>)
        : null,
  };
}
