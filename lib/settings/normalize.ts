import { DEFAULTS } from "./defaults";
import { SettingsZ } from "./schema";
import type { SettingsPayload } from "./types";

const VALID_FREQUENCIES = new Set(["weekly", "biweekly", "semimonthly", "monthly"]);
const DAYMAP: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function normalizeAndFix(input: any): SettingsPayload {
  try {
    return SettingsZ.parse(input);
  } catch {}

  const base = JSON.parse(JSON.stringify(DEFAULTS)) as SettingsPayload;
  const src = input && typeof input === "object" ? (input as Partial<SettingsPayload>) : {};
  const srcOrg = (src as { org?: Partial<SettingsPayload["org"]> }).org ?? {};
  const safeOrg: SettingsPayload["org"] = {
    general: { ...base.org.general, ...(srcOrg.general ?? {}) },
    scheduling: { ...base.org.scheduling, ...(srcOrg.scheduling ?? {}) },
    payroll: { ...base.org.payroll, ...(srcOrg.payroll ?? {}) },
    theme: {
      ...base.org.theme,
      ...(srcOrg.theme ?? {}),
      brand: {
        ...base.org.theme.brand,
        ...((srcOrg.theme ?? {}).brand ?? {}),
      },
    },
  };

  const safe: SettingsPayload = {
    ...base,
    ...src,
    org: safeOrg,
    location: { ...base.location, ...(src.location ?? {}) },
    role: { ...base.role, ...(src.role ?? {}) },
    user: { ...base.user, ...(src.user ?? {}) },
    device: { ...base.device, ...(src.device ?? {}) },
  };

  const gp = safe.org.payroll;
  const freq = String(gp.frequency ?? "").toLowerCase();
  gp.frequency = (VALID_FREQUENCIES.has(freq) ? freq : "biweekly") as SettingsPayload["org"]["payroll"]["frequency"];

  const payday = String(gp.payday ?? "").toLowerCase();
  gp.payday = (DAYMAP[payday] as SettingsPayload["org"]["payroll"]["payday"] | undefined) ?? "Friday";

  const periodStart = String(gp.periodStart ?? "").toLowerCase();
  gp.periodStart = periodStart === "sunday" ? "Sunday" : "Monday";

  if (safe.org.general.weekStart !== "Mon" && safe.org.general.weekStart !== "Sun") {
    safe.org.general.weekStart = "Mon";
  }

  if (!isNonEmptyString(safe.org.theme.brand.primary)) {
    safe.org.theme.brand.primary = "#0B6";
  } else {
    safe.org.theme.brand.primary = safe.org.theme.brand.primary.trim();
  }

  if (!isNonEmptyString(safe.org.theme.brand.accent)) {
    safe.org.theme.brand.accent = "#FF8A00";
  } else {
    safe.org.theme.brand.accent = safe.org.theme.brand.accent.trim();
  }

  return SettingsZ.parse(safe);
}
