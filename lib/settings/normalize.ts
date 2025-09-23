import { DEFAULTS } from "./defaults";
import { SettingsZ } from "./schema";
import type { SettingsPayload } from "./types";

const DAYMAP:Record<string,string> = {
  monday:"Monday", tuesday:"Tuesday", wednesday:"Wednesday",
  thursday:"Thursday", friday:"Friday", saturday:"Saturday", sunday:"Sunday"
};

export function normalizeAndFix(input:any): SettingsPayload {
  try { return SettingsZ.parse(input); } catch {}
  const base = JSON.parse(JSON.stringify(DEFAULTS)) as SettingsPayload;
  const src = (input && typeof input==="object") ? input : {};
  const safe = { ...base, ...src, org: { ...base.org, ...(src as any).org } } as SettingsPayload;

  // Payroll
  const gp:any = safe.org.payroll || {};
  const f = String(gp.frequency||"").toLowerCase();
  safe.org.payroll.frequency = ["weekly","biweekly","semimonthly","monthly"].includes(f)
    ? f as SettingsPayload["org"]["payroll"]["frequency"]
    : "biweekly";
  const pd = String(gp.payday||"").toLowerCase();
  const mappedPayday = DAYMAP[pd] as SettingsPayload["org"]["payroll"]["payday"] | undefined;
  safe.org.payroll.payday = mappedPayday ?? "Friday";
  const ps = String(gp.periodStart||"").toLowerCase();
  safe.org.payroll.periodStart = ps==="sunday" ? "Sunday" : "Monday";

  // General
  if (safe.org.general.weekStart!=="Mon" && safe.org.general.weekStart!=="Sun") safe.org.general.weekStart="Mon";

  // Theme brand
  if (!safe.org.theme.brand?.primary) safe.org.theme.brand.primary="#0B6";
  if (!safe.org.theme.brand?.accent) safe.org.theme.brand.accent="#FF8A00";

  return SettingsZ.parse(safe);
}
