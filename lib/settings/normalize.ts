import { DEFAULTS } from "./defaults";
import { SettingsZ } from "./schema";
import type { Payday, PayrollFrequency, SettingsPayload } from "./types";

const DAYMAP: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

export function normalizeAndFix(input: any): SettingsPayload {
  try {
    return SettingsZ.parse(input);
  } catch {}

  const base = JSON.parse(JSON.stringify(DEFAULTS)) as SettingsPayload;
  const src = input && typeof input === "object" ? input : {};
  const safe = { ...base, ...src, org: { ...base.org, ...(src as any).org } } as SettingsPayload;

  const gp = (safe.org as any).payroll || {};
  const freq = String(gp.frequency || "").toLowerCase();
  if (["weekly", "biweekly", "semimonthly", "monthly"].includes(freq)) {
    safe.org.payroll.frequency = freq as PayrollFrequency;
  } else {
    safe.org.payroll.frequency = "biweekly";
  }

  const pd = String(gp.payday || "").toLowerCase();
  const payday = DAYMAP[pd] as Payday | undefined;
  safe.org.payroll.payday = payday ?? "Friday";

  const ps = String(gp.periodStart || "").toLowerCase();
  safe.org.payroll.periodStart = ps === "sunday" ? "Sunday" : "Monday";

  const ws = (safe.org as any).general?.weekStart;
  if (ws !== "Mon" && ws !== "Sun") safe.org.general.weekStart = "Mon";

  if (!(safe.org as any).theme?.brand?.primary) safe.org.theme.brand.primary = "#0B6";
  if (!(safe.org as any).theme?.brand?.accent) safe.org.theme.brand.accent = "#FF8A00";

  return SettingsZ.parse(safe);
}
