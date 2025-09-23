import { DEFAULTS } from "./defaults";
import { SettingsZ } from "./schema";
import type { SettingsPayload } from "./types";

export function normalizeAndFix(input: any): SettingsPayload {
  const base = JSON.parse(JSON.stringify(DEFAULTS)) as SettingsPayload;
  try {
    // try parse straight
    return SettingsZ.parse(input);
  } catch {
    const safe = { ...base, ...(input || {}) };

    // Payroll fixes
    const freq = String(safe.org?.payroll?.frequency || "").toLowerCase();
    if (!["weekly", "biweekly", "semimonthly", "monthly"].includes(freq)) safe.org.payroll.frequency = "biweekly";
    const payday = String(safe.org?.payroll?.payday || "").toLowerCase();
    const days: Record<string, string> = {monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday", thursday: "Thursday", friday: "Friday", saturday: "Saturday", sunday: "Sunday"};
    safe.org.payroll.payday = days[payday] || "Friday";
    const ps = String(safe.org?.payroll?.periodStart || "").toLowerCase();
    safe.org.payroll.periodStart = ps === "sunday" ? "Sunday" : "Monday";

    // General
    if (!["Mon", "Sun"].includes(safe.org.general.weekStart)) safe.org.general.weekStart = "Mon";

    // Theme brand
    if (!safe.org.theme.brand?.primary) safe.org.theme.brand.primary = "#0B6";
    if (!safe.org.theme.brand?.accent) safe.org.theme.brand.accent = "#FF8A00";

    return SettingsZ.parse(safe);
  }
}
