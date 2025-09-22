type MaybeNumber = number | null | undefined | string;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export type PayType = "hourly" | "commission" | "salary" | "hybrid" | "guarantee" | "custom";

export type CompensationComponent = {
  enabled: boolean;
  rate: number | null;
};

export type GuaranteePayoutMode = "higher" | "stacked";

export type CompensationGuarantee = {
  enabled: boolean;
  weekly_amount: number | null;
  commission_rate: number | null;
  payout_mode: GuaranteePayoutMode;
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
  guarantee: { enabled: false, weekly_amount: null, commission_rate: null, payout_mode: "higher" },
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
    return { enabled: false, weekly_amount: null, commission_rate: null, payout_mode: "higher" };
  }
  const enabled = ensureBoolean((value as any).enabled, false);
  const weekly = ensureNumber((value as any).weekly_amount);
  const commissionRate = ensureNumber((value as any).commission_rate);
  const payoutModeRaw = typeof (value as any).payout_mode === "string" ? (value as any).payout_mode : null;
  const payoutMode: GuaranteePayoutMode = payoutModeRaw === "stacked" ? "stacked" : "higher";
  return {
    enabled,
    weekly_amount: weekly,
    commission_rate: commissionRate,
    payout_mode: payoutMode,
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
      payout_mode: "higher",
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
      payout_mode: plan.guarantee.payout_mode === "stacked" ? "stacked" : "higher",
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

type SummaryOptions = {
  staffNameMap?: Map<number, string>;
  locale?: string;
  currency?: string;
};

function formatPercentDisplay(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCurrencyDisplay(value: number, locale: string, currency: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function planSummaryLines(plan: CompensationPlan, options: SummaryOptions = {}): string[] {
  const { staffNameMap, locale = "en-US", currency = "USD" } = options;
  const lines: string[] = [];

  if (plan.commission.enabled && Number.isFinite(plan.commission.rate) && (plan.commission.rate ?? 0) > 0) {
    lines.push(`${formatPercentDisplay(plan.commission.rate as number, locale)} commission on their own grooms.`);
  }

  if (plan.hourly.enabled && Number.isFinite(plan.hourly.rate) && (plan.hourly.rate ?? 0) > 0) {
    lines.push(
      `${formatCurrencyDisplay(plan.hourly.rate as number, locale, currency)} per hour base pay.`,
    );
  }

  if (plan.salary.enabled && Number.isFinite(plan.salary.rate) && (plan.salary.rate ?? 0) > 0) {
    lines.push(
      `${formatCurrencyDisplay(plan.salary.rate as number, locale, currency)} salary per year.`,
    );
  }

  if (plan.guarantee.enabled && Number.isFinite(plan.guarantee.weekly_amount) && (plan.guarantee.weekly_amount ?? 0) > 0) {
    const payoutMode = plan.guarantee.payout_mode === "stacked" ? "stacked" : "higher";
    const formattedAmount = formatCurrencyDisplay(plan.guarantee.weekly_amount as number, locale, currency);
    if (payoutMode === "stacked") {
      const hasCommission = plan.commission.enabled && Number.isFinite(plan.commission.rate) && (plan.commission.rate ?? 0) > 0;
      if (hasCommission) {
        lines.push(`${formattedAmount} per week guaranteed in addition to their commission earnings.`);
      } else {
        lines.push(`${formattedAmount} per week guaranteed.`);
      }
    } else {
      const guaranteeRate = Number.isFinite(plan.guarantee.commission_rate)
        ? (plan.guarantee.commission_rate as number)
        : Number.isFinite(plan.commission.rate)
        ? (plan.commission.rate as number)
        : null;
      const commissionText = guaranteeRate
        ? `${formatPercentDisplay(guaranteeRate, locale)} commission`
        : "their commission";
      lines.push(`${formattedAmount} per week guaranteed or ${commissionText}—whichever pays more.`);
    }
  }

  let hasLead = lines.length > 0;
  for (const entry of plan.overrides ?? []) {
    if (!Number.isFinite(entry?.percentage) || (entry?.percentage ?? 0) <= 0) continue;
    const staffName = staffNameMap?.get(entry.subordinate_id) ?? `Staff #${entry.subordinate_id}`;
    const prefix = hasLead ? "Plus " : "";
    lines.push(
      `${prefix}${formatPercentDisplay(entry.percentage as number, locale)} of all grooms ${staffName} completes.`,
    );
    hasLead = true;
  }

  return lines;
}

export type CompensationPlanDraft = {
  commission: { enabled: boolean; rate: string };
  hourly: { enabled: boolean; rate: string };
  salary: { enabled: boolean; rate: string };
  guarantee: { enabled: boolean; weeklyAmount: string; commissionRate: string; payoutMode: GuaranteePayoutMode };
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

function normalisePayoutMode(value: string): GuaranteePayoutMode {
  return value === "stacked" ? "stacked" : "higher";
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
      payoutMode: plan.guarantee.payout_mode === "stacked" ? "stacked" : "higher",
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

  const payoutMode = normalisePayoutMode(draft.guarantee.payoutMode);

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
      payout_mode: payoutMode,
    },
    overrides,
  };

  if (plan.guarantee.enabled) {
    if (plan.guarantee.payout_mode === "higher") {
      if (guaranteeCommission.valid && guaranteeCommission.value !== null) {
        plan.guarantee.commission_rate = guaranteeCommission.value;
      } else if (plan.commission.enabled && plan.commission.rate !== null) {
        plan.guarantee.commission_rate = plan.commission.rate;
      } else if (!guaranteeCommission.valid) {
        // error already recorded
      } else {
        errors.push("Enable a commission rate to compare against the weekly guarantee.");
      }
    } else {
      plan.guarantee.commission_rate = null;
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
