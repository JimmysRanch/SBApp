import { z } from "zod";
export const GeneralZ = z.object({ name: z.string().default(""), timezone: z.string().default("America/Chicago"), weekStart: z.enum(["Mon","Sun"]).default("Mon") });
export const SchedulingZ = z.object({
  slotMinutes: z.union([z.literal(5),z.literal(10),z.literal(15),z.literal(20),z.literal(30)]).default(15),
  overlap: z.enum(["disallow","warn","allow"]).default("disallow"),
  autoAssign: z.enum(["revenue-balance","round-robin","preference"]).default("revenue-balance")
});
export const PayrollZ = z.object({
  frequency: z.enum(["weekly","biweekly","semimonthly","monthly"]).default("biweekly"),
  payday: z.enum(["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]).default("Friday"),
  periodStart: z.enum(["Monday","Sunday"]).default("Monday")
});
export const ThemeZ = z.object({
  mode: z.enum(["light","dark","auto"]).default("light"),
  motion: z.enum(["standard","reduced"]).default("standard"),
  background: z.enum(["static","parallax","liquid"]).default("static"),
  brand: z.object({ primary: z.string().default("#0B6"), accent: z.string().default("#FF8A00") })
});
export const OrgZ = z.object({ general: GeneralZ, scheduling: SchedulingZ, payroll: PayrollZ, theme: ThemeZ });
export const SettingsZ = z.object({
  version: z.number().default(1),
  org: OrgZ,
  location: z.record(z.string(), z.any()).default({}),
  role: z.record(z.string(), z.any()).default({}),
  user: z.record(z.string(), z.any()).default({}),
  device: z.record(z.string(), z.any()).default({})
});
