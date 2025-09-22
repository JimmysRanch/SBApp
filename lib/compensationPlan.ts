type MaybeNumber = number | null | undefined | string;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export type PayType = "hourly" | "commission" | "salary" | "hybrid" | "guarantee" | "custom";

export type CompensationComponent = {
  enabled: boolean;
  rate: number | null;
};

export type CompensationGuarantee = {
  enabled: boolean;
  weekly_amount: number | null;
  commission_rate: number | null;
};

export type CompensationOverride = {
  subordinate_id: number;
  percentage: number;
};

export type CompensationPlan = {
  commission: CompensationComponent;
  hourly: CompensationComponent;
  salary: CompensationComponent;
  guarantee: CompensationGuarantee;
  overrides: CompensationOverride[];
};

export const defaultCompensationPlan: CompensationPlan = {
  commission: { enabled: false, rate: null },
  hourly: { enabled: false, rate: null },
  salary: { enabled: false, rate: null },
  guarantee: { enabled: false, weekly_amount: null, commission_rate: null },
  overrides: [],
};

function ensureNumber(value: MaybeNumber): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }
  return null;
}

function ensureBoolean(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") return value;
  return fallback;
}

function ensureComponent(value: unknown, fallbackRate: number | null = null): CompensationComponent {
  if (!isPlainObject(value)) {
    return { enabled: false, rate: fallbackRate };
  }
  const enabled = ensureBoolean((value as any).enabled, false);
  const rate = ensureNumber((value as any).rate);
  return { enabled, rate };
}

function ensureGuarantee(value: unknown): CompensationGuarantee {
  if (!isPlainObject(value)) {
    return { enabled: false, weekly_amount: null, commission_rate: null };
  }
  const enabled = ensureBoolean((value as any).enabled, false);
  const weekly = ensureNumber((value as any).weekly_amount);
  const commissionRate = ensureNumber((value as any).commission_rate);
  return {
    enabled,
    weekly_amount: weekly,
    commission_rate: commissionRate,
  };
}

function ensureOverrides(value: unknown): CompensationOverride[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!isPlainObject(item)) return null;
      const subordinateId = ensureNumber((item as any).subordinate_id);
      const percentage = ensureNumber((item as any).percentage);
      if (!Number.isFinite(subordinateId) || subordinateId === null) return null;
      if (typeof subordinateId !== "number") return null;
      if (!Number.isFinite(percentage ?? null)) return null;
      const pct = percentage as number;
      return {
        subordinate_id: subordinateId,
        percentage: pct,
      };
    })
    .filter((entry): entry is CompensationOverride => !!entry);
}

export function normaliseCompensationPlan(raw: unknown): CompensationPlan {
  if (!isPlainObject(raw)) {
    return { ...defaultCompensationPlan };
  }
  const commission = ensureComponent((raw as any).commission);
  const hourly = ensureComponent((raw as any).hourly);
  const salary = ensureComponent((raw as any).salary);
  const guarantee = ensureGuarantee((raw as any).guarantee);
  const overrides = ensureOverrides((raw as any).overrides);
  return {
    commission,
    hourly,
    salary,
    guarantee,
    overrides,
  };
}

function hasStoredPlan(raw: unknown): boolean {
  if (!isPlainObject(raw)) return false;
  return Object.keys(raw as Record<string, unknown>).length > 0;
}

export function planFromRecord(record: {
  compensation_plan?: unknown;
  commission_rate?: MaybeNumber;
  hourly_rate?: MaybeNumber;
  salary_rate?: MaybeNumber;
  pay_type?: string | null;
}): CompensationPlan {
  const normalised = normaliseCompensationPlan(record.compensation_plan);
  if (hasStoredPlan(record.compensation_plan)) {
    return normalised;
  }
  const commissionRate = ensureNumber(record.commission_rate);
  const hourlyRate = ensureNumber(record.hourly_rate);
  const salaryRate = ensureNumber(record.salary_rate);
  const payType = typeof record.pay_type === "string" ? record.pay_type : null;
  return {
    commission: {
      enabled: !!commissionRate && commissionRate > 0,
      rate: commissionRate && commissionRate > 0 ? commissionRate : commissionRate ?? null,
    },
    hourly: {
      enabled: !!hourlyRate && hourlyRate > 0,
      rate: hourlyRate ?? null,
    },
    salary: {
      enabled: !!salaryRate && salaryRate > 0,
      rate: salaryRate ?? null,
    },
    guarantee: {
      enabled: payType === "guarantee",
      weekly_amount: null,
      commission_rate: commissionRate ?? null,
    },
    overrides: [],
  };
}

function clampPercentage(value: number | null): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function clampNonNegative(value: number | null): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  if (value < 0) return 0;
  return value;
}

export function cleanOverrides(overrides: CompensationOverride[]): CompensationOverride[] {
  const map = new Map<number, number>();
  for (const entry of overrides) {
    const subordinateId = entry.subordinate_id;
    if (!Number.isFinite(subordinateId) || subordinateId <= 0) continue;
    const percentage = clampPercentage(entry.percentage ?? null);
    if (percentage === null) continue;
    map.set(subordinateId, percentage);
  }
  return Array.from(map.entries()).map(([subordinate_id, percentage]) => ({ subordinate_id, percentage }));
}

export function toStoredPlan(plan: CompensationPlan): CompensationPlan {
  const commissionRate = clampPercentage(plan.commission.rate ?? null);
  const hourlyRate = clampNonNegative(plan.hourly.rate ?? null);
  const salaryRate = clampNonNegative(plan.salary.rate ?? null);
  const weekly = clampNonNegative(plan.guarantee.weekly_amount ?? null);
  const guaranteeRate = clampPercentage(plan.guarantee.commission_rate ?? null);
  return {
    commission: {
      enabled: plan.commission.enabled && commissionRate !== null,
      rate: plan.commission.enabled && commissionRate !== null ? commissionRate : null,
    },
    hourly: {
      enabled: plan.hourly.enabled && hourlyRate !== null,
      rate: plan.hourly.enabled && hourlyRate !== null ? hourlyRate : null,
    },
    salary: {
      enabled: plan.salary.enabled && salaryRate !== null,
      rate: plan.salary.enabled && salaryRate !== null ? salaryRate : null,
    },
    guarantee: {
      enabled: plan.guarantee.enabled && weekly !== null,
      weekly_amount: plan.guarantee.enabled && weekly !== null ? weekly : null,
      commission_rate: plan.guarantee.enabled && guaranteeRate !== null ? guaranteeRate : null,
    },
    overrides: cleanOverrides(plan.overrides ?? []),
  };
}

export function derivePayType(plan: CompensationPlan): PayType {
  const active: string[] = [];
  if (plan.commission.enabled) active.push("commission");
  if (plan.hourly.enabled) active.push("hourly");
  if (plan.salary.enabled) active.push("salary");
  if (plan.guarantee.enabled) active.push("guarantee");
  if (active.length === 0) return "hourly";
  if (active.length === 1) {
    const key = active[0];
    if (key === "guarantee") return "guarantee";
    if (key === "hourly") return "hourly";
    if (key === "salary") return "salary";
    return "commission";
  }
  return "custom";
}

export function clonePlan(plan: CompensationPlan): CompensationPlan {
  return {
    commission: { ...plan.commission },
    hourly: { ...plan.hourly },
    salary: { ...plan.salary },
    guarantee: { ...plan.guarantee },
    overrides: [...(plan.overrides ?? [])],
  };
}

export function planHasConfiguration(plan: CompensationPlan): boolean {
  return (
    !!plan &&
    (plan.commission.enabled ||
      plan.hourly.enabled ||
      plan.salary.enabled ||
      plan.guarantee.enabled ||
      (Array.isArray(plan.overrides) && plan.overrides.length > 0))
  );
}

export function getCommissionRate(plan: CompensationPlan): number {
  if (plan.commission.enabled && Number.isFinite(plan.commission.rate)) {
    return plan.commission.rate ?? 0;
  }
  if (plan.guarantee.enabled && Number.isFinite(plan.guarantee.commission_rate)) {
    return plan.guarantee.commission_rate ?? 0;
  }
  return 0;
}

export function getHourlyRate(plan: CompensationPlan): number {
  if (plan.hourly.enabled && Number.isFinite(plan.hourly.rate)) {
    return plan.hourly.rate ?? 0;
  }
  return 0;
}

export function getSalaryRate(plan: CompensationPlan): number {
  if (plan.salary.enabled && Number.isFinite(plan.salary.rate)) {
    return plan.salary.rate ?? 0;
  }
  return 0;
}

export type CompensationPlanDraft = {
  commission: { enabled: boolean; rate: string };
  hourly: { enabled: boolean; rate: string };
  salary: { enabled: boolean; rate: string };
  guarantee: { enabled: boolean; weeklyAmount: string; commissionRate: string };
  overridesEnabled: boolean;
  overrides: { subordinateId: number | null; percentage: string }[];
};

function formatPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "";
  return Number((value * 100).toFixed(2)).toString();
}

function formatNumber(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "";
  return Number(value.toFixed(2)).toString();
}

export function draftFromPlan(plan: CompensationPlan): CompensationPlanDraft {
  return {
    commission: {
      enabled: plan.commission.enabled,
      rate: plan.commission.enabled ? formatPercent(plan.commission.rate ?? null) : "",
    },
    hourly: {
      enabled: plan.hourly.enabled,
      rate: plan.hourly.enabled ? formatNumber(plan.hourly.rate ?? null) : "",
    },
    salary: {
      enabled: plan.salary.enabled,
      rate: plan.salary.enabled ? formatNumber(plan.salary.rate ?? null) : "",
    },
    guarantee: {
      enabled: plan.guarantee.enabled,
      weeklyAmount: plan.guarantee.enabled ? formatNumber(plan.guarantee.weekly_amount ?? null) : "",
      commissionRate: plan.guarantee.enabled ? formatPercent(plan.guarantee.commission_rate ?? null) : "",
    },
    overridesEnabled: (plan.overrides ?? []).length > 0,
    overrides: (plan.overrides ?? []).map((entry) => ({
      subordinateId: entry.subordinate_id,
      percentage: formatPercent(entry.percentage ?? null),
    })),
  };
}

type ParseFieldResult = { value: number | null; provided: boolean; valid: boolean };

function parsePercentField(
  input: string,
  label: string,
  errors: string[],
  { optional = false }: { optional?: boolean } = {}
): ParseFieldResult {
  const trimmed = input.trim();
  if (!trimmed) {
    if (optional) return { value: null, provided: false, valid: true };
    errors.push(`${label} is required.`);
    return { value: null, provided: false, valid: false };
  }
  const cleaned = trimmed.replace(/[%\s]/g, "");
  const normalised = Number(cleaned.replace(/,/g, "."));
  if (!Number.isFinite(normalised)) {
    errors.push(`${label} must be a valid number.`);
    return { value: null, provided: true, valid: false };
  }
  if (normalised < 0 || normalised > 100) {
    errors.push(`${label} must be between 0 and 100.`);
    return { value: null, provided: true, valid: false };
  }
  return { value: normalised / 100, provided: true, valid: true };
}

function parseCurrencyField(
  input: string,
  label: string,
  errors: string[],
  { optional = false }: { optional?: boolean } = {}
): ParseFieldResult {
  const trimmed = input.trim();
  if (!trimmed) {
    if (optional) return { value: null, provided: false, valid: true };
    errors.push(`${label} is required.`);
    return { value: null, provided: false, valid: false };
  }
  const cleaned = trimmed.replace(/[$,\s]/g, "");
  const normalised = Number(cleaned);
  if (!Number.isFinite(normalised)) {
    errors.push(`${label} must be a valid number.`);
    return { value: null, provided: true, valid: false };
  }
  if (normalised < 0) {
    errors.push(`${label} cannot be negative.`);
    return { value: null, provided: true, valid: false };
  }
  return { value: normalised, provided: true, valid: true };
}

export type DraftParseResult = {
  plan: CompensationPlan;
  commissionRate: number;
  hourlyRate: number;
  salaryRate: number;
  payType: PayType;
  errors: string[];
};

export function parseDraft(draft: CompensationPlanDraft): DraftParseResult {
  const errors: string[] = [];

  const commissionResult = draft.commission.enabled
    ? parsePercentField(draft.commission.rate, "Commission %", errors)
    : { value: null, provided: false, valid: true };

  const hourlyResult = draft.hourly.enabled
    ? parseCurrencyField(draft.hourly.rate, "Hourly rate", errors)
    : { value: null, provided: false, valid: true };

  const salaryResult = draft.salary.enabled
    ? parseCurrencyField(draft.salary.rate, "Salary rate", errors)
    : { value: null, provided: false, valid: true };

  const guaranteeWeekly = draft.guarantee.enabled
    ? parseCurrencyField(draft.guarantee.weeklyAmount, "Weekly guarantee", errors)
    : { value: null, provided: false, valid: true };

  const guaranteeCommission = draft.guarantee.enabled
    ? parsePercentField(draft.guarantee.commissionRate, "Guarantee commission %", errors, { optional: true })
    : { value: null, provided: false, valid: true };

  let overrides: CompensationOverride[] = [];
  if (draft.overridesEnabled) {
    overrides = draft.overrides
      .map((entry, index) => {
        const hasSubordinate = entry.subordinateId != null;
        const hasPercent = entry.percentage.trim() !== "";
        if (!hasSubordinate && !hasPercent) {
          return null;
        }
        if (!hasSubordinate || !hasPercent) {
          errors.push(`Override row ${index + 1} must include a groomer and percentage.`);
          return null;
        }
        const percentResult = parsePercentField(entry.percentage, `Override % (row ${index + 1})`, errors);
        if (!percentResult.valid || percentResult.value === null) {
          return null;
        }
        return {
          subordinate_id: entry.subordinateId!,
          percentage: percentResult.value,
        } as CompensationOverride;
      })
      .filter((entry): entry is CompensationOverride => !!entry);
  }

  const plan: CompensationPlan = {
    commission: {
      enabled: draft.commission.enabled && commissionResult.value !== null,
      rate: commissionResult.value,
    },
    hourly: {
      enabled: draft.hourly.enabled && hourlyResult.value !== null,
      rate: hourlyResult.value,
    },
    salary: {
      enabled: draft.salary.enabled && salaryResult.value !== null,
      rate: salaryResult.value,
    },
    guarantee: {
      enabled: draft.guarantee.enabled && guaranteeWeekly.value !== null,
      weekly_amount: guaranteeWeekly.value,
      commission_rate: null,
    },
    overrides,
  };

  if (plan.guarantee.enabled) {
    if (guaranteeCommission.valid && guaranteeCommission.value !== null) {
      plan.guarantee.commission_rate = guaranteeCommission.value;
    } else if (plan.commission.enabled && plan.commission.rate !== null) {
      plan.guarantee.commission_rate = plan.commission.rate;
    } else if (!guaranteeCommission.valid) {
      // error already recorded
    } else {
      errors.push("Guarantee commission % is required when no commission rate is enabled.");
    }
  }

  const primaryEnabled =
    plan.commission.enabled || plan.hourly.enabled || plan.salary.enabled || plan.guarantee.enabled;
  if (!primaryEnabled) {
    errors.push("Enable at least one primary compensation option (commission, hourly, salary, or guarantee).");
  }

  const storedPlan = toStoredPlan(plan);
  const payType = derivePayType(storedPlan);
  const commissionRate = getCommissionRate(storedPlan);
  const hourlyRate = getHourlyRate(storedPlan);
  const salaryRate = getSalaryRate(storedPlan);

  return {
    plan: storedPlan,
    commissionRate,
    hourlyRate,
    salaryRate,
    payType,
    errors,
  };
}

export function mergeDraftWithPlan(
  draft: CompensationPlanDraft,
  plan: CompensationPlan
): CompensationPlanDraft {
  const next = draftFromPlan(plan);
  return {
    ...draft,
    ...next,
  };
}
