import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { z } from "zod";

import { getSupabaseAdmin } from "@/lib/supabase/server";
import {
  clonePlan,
  defaultCompensationPlan,
  derivePayType,
  getCommissionRate,
  getHourlyRate,
  getSalaryRate,
  normaliseCompensationPlan,
  planHasConfiguration,
  toStoredPlan,
} from "@/lib/compensationPlan";

const PERMISSION_KEYS = [
  "can_view_reports",
  "can_edit_schedule",
  "can_manage_discounts",
  "can_manage_staff",
] as const;

const optionalText = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value == null) return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  });

const optionalEmail = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value, ctx) => {
    if (value == null) return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = z.string().email().safeParse(trimmed);
    if (!parsed.success) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid email address" });
      return z.NEVER;
    }
    return trimmed;
  });

const optionalPhone = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value, ctx) => {
    if (value == null) return null;
    const digits = value.replace(/\D/g, "");
    if (!digits) return null;
    if (digits.length < 7) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Phone number must include at least 7 digits",
      });
      return z.NEVER;
    }
    return digits;
  });

const optionalNumber = z
  .union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((value, ctx) => {
    if (value == null || value === "") return null;
    const numeric = typeof value === "string" ? Number(value) : value;
    if (!Number.isFinite(numeric)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid number" });
      return z.NEVER;
    }
    return numeric;
  });

const permissionsSchema = z
  .record(z.string(), z.boolean())
  .optional()
  .transform((value) => {
    const result: Record<(typeof PERMISSION_KEYS)[number], boolean> = {
      can_view_reports: false,
      can_edit_schedule: false,
      can_manage_discounts: false,
      can_manage_staff: false,
    };
    if (!value) {
      return result;
    }
    for (const key of PERMISSION_KEYS) {
      if (typeof value[key] === "boolean") {
        result[key] = value[key];
      }
    }
    return result;
  });

const goalsSchema = z
  .union([
    z.object({
      weekly_revenue_target: optionalNumber,
      desired_dogs_per_day: optionalNumber,
    }),
    z.null(),
    z.undefined(),
  ])
  .transform((value) => {
    if (!value) return null;
    const weekly = value.weekly_revenue_target ?? null;
    const dogs = value.desired_dogs_per_day ?? null;
    if (weekly === null && dogs === null) return null;
    return {
      weekly_revenue_target: weekly,
      desired_dogs_per_day: dogs,
    };
  });

const compensationPlanSchema = z
  .union([
    z
      .object({
        commission: z
          .object({
            enabled: z.boolean().optional(),
            rate: optionalNumber,
          })
          .optional(),
        hourly: z
          .object({
            enabled: z.boolean().optional(),
            rate: optionalNumber,
          })
          .optional(),
        salary: z
          .object({
            enabled: z.boolean().optional(),
            rate: optionalNumber,
          })
          .optional(),
        guarantee: z
          .object({
            enabled: z.boolean().optional(),
            weekly_amount: optionalNumber,
            commission_rate: optionalNumber,
            payout_mode: z.enum(["higher", "stacked"]).optional(),
          })
          .optional(),
        overrides: z
          .array(
            z.object({
              subordinate_id: z.number().int().positive(),
              percentage: optionalNumber,
            }),
          )
          .optional(),
      })
      .strict(),
    z.null(),
    z.undefined(),
  ])
  .transform((value) => {
    if (!value) {
      return clonePlan(defaultCompensationPlan);
    }
    const normalised = normaliseCompensationPlan(value);
    return toStoredPlan(normalised);
  });

const staffSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  role: z.string().trim().min(1, "Role is required"),
  email: optionalEmail,
  phone: optionalPhone,
  status: optionalText,
  pay_type: z.enum(["hourly", "commission", "salary", "hybrid", "guarantee", "custom"]).default("hourly"),
  commission_rate: optionalNumber,
  hourly_rate: optionalNumber,
  salary_rate: optionalNumber,
  compensation_plan: compensationPlanSchema.optional(),
  app_permissions: permissionsSchema,
  avatar_url: optionalText,
  address_street: optionalText,
  address_city: optionalText,
  address_state: optionalText,
  address_zip: optionalText,
  emergency_contact_name: optionalText,
  emergency_contact_phone: optionalPhone,
  manager_notes: optionalText,
  goals: goalsSchema,
  });

export async function GET(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const includeInactiveParam = url.searchParams.get("include_inactive");
  const includeInactive = typeof includeInactiveParam === "string"
    ? ["1", "true", "yes"].includes(includeInactiveParam.toLowerCase())
    : false;

  let query = supabase
    .from("employees")
    .select("id, name, role, avatar_url, active, status, user_id, specialties")
    .order("name", { ascending: true });

  if (!includeInactive) {
    query = query.eq("active", true);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    role: row.role,
    avatarUrl: row.avatar_url,
    active: row.active ?? false,
    status: row.status,
    profileId: row.user_id,
    specialties: Array.isArray(row.specialties) ? row.specialties : [],
  }));

  return NextResponse.json({ data: rows });
}

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: me, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  if (!me || !["master", "admin"].includes(me.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = staffSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid staff payload",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const compensationPlan = data.compensation_plan
    ? toStoredPlan(data.compensation_plan)
    : clonePlan(defaultCompensationPlan);
  const planConfigured = planHasConfiguration(compensationPlan);

  const commissionRate = planConfigured ? getCommissionRate(compensationPlan) : data.commission_rate ?? 0;
  const hourlyRate = planConfigured ? getHourlyRate(compensationPlan) : data.hourly_rate ?? 0;
  const salaryRate = planConfigured ? getSalaryRate(compensationPlan) : data.salary_rate ?? 0;
  const finalPayType = planConfigured ? derivePayType(compensationPlan) : data.pay_type ?? "hourly";

  if (commissionRate < 0 || commissionRate > 1) {
    return NextResponse.json(
      { error: "Commission rate must be between 0 and 1" },
      { status: 400 }
    );
  }

  if (hourlyRate < 0 || salaryRate < 0) {
    return NextResponse.json(
      { error: "Pay rates must be zero or greater" },
      { status: 400 }
    );
  }

  const statusLabel = data.status ?? "Active";
  const normalisedStatus = statusLabel?.trim() || "Active";
  const statusLower = normalisedStatus.toLowerCase();
  const isActive = statusLower.includes("active") && !statusLower.includes("inactive");

  let admin;
  try {
    admin = getSupabaseAdmin();
  } catch (cause) {
    console.error("Staff creation misconfigured: missing service role key", cause);
    return NextResponse.json(
      {
        error: "Staff creation is not configured. Please set SUPABASE_SERVICE_ROLE_KEY on the server.",
      },
      { status: 500 }
    );
  }

  const employeePayload = {
    name: data.name,
    role: data.role,
    email: data.email,
    phone: data.phone,
    status: normalisedStatus,
    active: isActive,
    avatar_url: data.avatar_url,
    address_street: data.address_street,
    address_city: data.address_city,
    address_state: data.address_state,
    address_zip: data.address_zip,
    emergency_contact_name: data.emergency_contact_name,
    emergency_contact_phone: data.emergency_contact_phone,
    pay_type: finalPayType,
    commission_rate: commissionRate,
    hourly_rate: hourlyRate,
    salary_rate: salaryRate,
    compensation_plan: compensationPlan,
    app_permissions: data.app_permissions,
    manager_notes: data.manager_notes,
  };

  const { data: created, error: insertError } = await admin
    .from("employees")
    .insert(employeePayload)
    .select("id")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  if (created?.id && data.goals) {
    await admin
      .from("staff_goals")
      .upsert(
        {
          staff_id: created.id,
          weekly_revenue_target: data.goals.weekly_revenue_target ?? null,
          desired_dogs_per_day: data.goals.desired_dogs_per_day ?? null,
        },
        { onConflict: "staff_id" }
      );
  }

  return NextResponse.json({ data: { id: created?.id } }, { status: 201 });
}
