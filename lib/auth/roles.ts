import { isFrontDeskRole, isGroomerRole, isManagerRole } from "@/lib/auth/access";
import type { Role as LegacyRole } from "@/lib/auth/profile";

export function toLegacyRole(role: string | null): LegacyRole | null {
  if (!role) return null;
  const normalized = role.toLowerCase();
  if (normalized.includes("master")) return "master";
  if (normalized.includes("admin")) return "admin";
  if (normalized.includes("senior_groomer") || normalized.includes("senior groomer") || normalized.includes("manager")) {
    return "senior_groomer";
  }
  if (normalized.includes("front desk") || normalized.includes("receptionist")) {
    return "receptionist";
  }
  if (normalized.includes("groomer")) return "groomer";
  if (normalized.includes("client")) return "client";
  return null;
}

export function derivePermissionFlags(role: string | null) {
  const legacy = toLegacyRole(role);
  const manager = legacy ? isManagerRole(legacy) : false;
  const frontDesk = legacy ? isFrontDeskRole(legacy) : false;
  const groomer = legacy ? isGroomerRole(legacy) : false;

  return {
    canAccessSettings: manager,
    canManageCalendar: manager || frontDesk || groomer,
    canManageEmployees: manager,
    canViewReports: manager || frontDesk,
  };
}

export function canManageWorkspace(role: string | null): boolean {
  const legacy = toLegacyRole(role);
  return legacy ? isManagerRole(legacy) : false;
}
