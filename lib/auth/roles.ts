import { isFrontDeskRole, isGroomerRole, isManagerRole } from "@/lib/auth/access";
import { normaliseRole, type Role as LegacyRole } from "@/lib/auth/profile";

export function toLegacyRole(role: string | LegacyRole | null): LegacyRole | null {
  if (!role) return null;
  if (typeof role === "string") {
    const trimmed = role.trim();
    if (!trimmed || trimmed.toLowerCase() === "guest") {
      return null;
    }
    return normaliseRole(trimmed);
  }
  return role;
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
