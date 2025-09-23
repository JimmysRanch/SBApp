import { DEFAULTS } from "./defaults";
import { SettingsPayload } from "./types";

const PAYROLL_FREQUENCIES = new Set<SettingsPayload["org"]["payroll"]["frequency"]>([
  "weekly",
  "biweekly",
  "semimonthly",
  "monthly"
]);

const PAYROLL_PAYDAYS: SettingsPayload["org"]["payroll"]["payday"][] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

const PERIOD_STARTS = new Set<SettingsPayload["org"]["payroll"]["periodStart"]>(["Monday", "Sunday"]);
const WEEK_STARTS = new Set<SettingsPayload["org"]["general"]["weekStart"]>(["Mon", "Sun"]);
const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

type Mutable<T> = {
  -readonly [K in keyof T]: Mutable<T[K]>;
};

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cloneOrDefault<T>(value: T | undefined, fallback: T): Mutable<T> {
  if (!value) return structuredClone(fallback) as Mutable<T>;
  try {
    return structuredClone(value) as Mutable<T>;
  } catch {
    return structuredClone(fallback) as Mutable<T>;
  }
}

export interface NormalizationResult {
  normalized: SettingsPayload;
  corrections: string[];
}

export function normalizeSettingsPayload(raw: unknown): NormalizationResult {
  const corrections: string[] = [];
  const base = (isRecord(raw) ? raw : {}) as Partial<SettingsPayload>;

  const normalized: Mutable<SettingsPayload> = {
    version: typeof base.version === "number" ? base.version : DEFAULTS.version,
    org: {
      general: {
        ...DEFAULTS.org.general,
        ...(isRecord(base.org) && isRecord((base.org as any).general) ? (base.org as any).general : {})
      },
      scheduling: {
        ...DEFAULTS.org.scheduling,
        ...(isRecord(base.org) && isRecord((base.org as any).scheduling) ? (base.org as any).scheduling : {})
      },
      payroll: {
        ...DEFAULTS.org.payroll,
        ...(isRecord(base.org) && isRecord((base.org as any).payroll) ? (base.org as any).payroll : {})
      },
      theme: {
        ...DEFAULTS.org.theme,
        ...(isRecord(base.org) && isRecord((base.org as any).theme) ? (base.org as any).theme : {})
      }
    },
    location: isRecord(base.location) ? cloneOrDefault(base.location, DEFAULTS.location) : structuredClone(DEFAULTS.location),
    role: isRecord(base.role) ? cloneOrDefault(base.role, DEFAULTS.role) : structuredClone(DEFAULTS.role),
    user: isRecord(base.user) ? cloneOrDefault(base.user, DEFAULTS.user) : structuredClone(DEFAULTS.user),
    device: isRecord(base.device) ? cloneOrDefault(base.device, DEFAULTS.device) : structuredClone(DEFAULTS.device)
  };

  if (!WEEK_STARTS.has(normalized.org.general.weekStart)) {
    normalized.org.general.weekStart = DEFAULTS.org.general.weekStart;
    corrections.push("org.general.weekStart");
  }

  if (!PAYROLL_FREQUENCIES.has(normalized.org.payroll.frequency)) {
    normalized.org.payroll.frequency = DEFAULTS.org.payroll.frequency;
    corrections.push("org.payroll.frequency");
  }

  const payday = normalized.org.payroll.payday;
  if (!PAYROLL_PAYDAYS.includes(payday)) {
    normalized.org.payroll.payday = "Friday";
    corrections.push("org.payroll.payday");
  }

  if (!PERIOD_STARTS.has(normalized.org.payroll.periodStart)) {
    normalized.org.payroll.periodStart = DEFAULTS.org.payroll.periodStart;
    corrections.push("org.payroll.periodStart");
  }

  const brand = normalized.org.theme.brand ?? (normalized.org.theme.brand = structuredClone(DEFAULTS.org.theme.brand));
  if (!brand || typeof brand !== "object") {
    normalized.org.theme.brand = structuredClone(DEFAULTS.org.theme.brand);
    corrections.push("org.theme.brand");
  } else {
    if (typeof brand.primary !== "string" || !HEX_COLOR.test(brand.primary)) {
      brand.primary = DEFAULTS.org.theme.brand.primary;
      corrections.push("org.theme.brand.primary");
    }
    if (typeof brand.accent !== "string" || !HEX_COLOR.test(brand.accent)) {
      brand.accent = DEFAULTS.org.theme.brand.accent;
      corrections.push("org.theme.brand.accent");
    }
  }

  return { normalized, corrections };
}
