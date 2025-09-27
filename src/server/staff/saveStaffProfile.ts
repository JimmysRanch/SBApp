import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

// Utility to normalize phone to E.164
function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, ""); // Fixed regex by removing the line break
}

// Utility to generate initials
function generateInitials(first: string, last: string) {
  return (first.charAt(0) + (last.charAt(0) || "")).toUpperCase();
}

// Validation schema
const staffProfileSchema = z.object({
  staffId: z.string().uuid().optional(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().regex(/^\+\d{10,15}$/, "Must be E.164"),
  status: z.string().min(1),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  avatar_url: z.string().optional(),
  initials: z.string().optional(),
  color_hex: z.string().optional(),
  bio: z.string().optional(),
  notes: z.string().optional(),
  profile_id: z.string().uuid().optional(),
  permissions: z.array(z.object({
    perm_key: z.string(),
    allowed: z.boolean(),
  })),
  compPlan: z.object({
    commission_enabled: z.boolean(),
    commission_pct: z.number().min(0).max(100).nullable(),
    hourly_enabled: z.boolean(),
    hourly_rate: z.number().min(0).nullable(),
    salary_enabled: z.boolean(),
    salary_annual: z.number().min(0).nullable(),
    weekly_guarantee_enabled: z.boolean(),
    weekly_guarantee: z.number().min(0).nullable(),
    guarantee_rule: z.enum(["whichever_higher", "pay_both"]).nullable(),
  }),
  overrides: z.array(z.object({
    manager_id: z.string().uuid(),
    member_id: z.string().uuid(),
    override_pct: z.number().min(0).max(100),
  })),
  availability: z.array(z.object({
    dow: z.number().int().min(0).max(6),
    start_time: z.string(), // "HH:MM"
    end_time: z.string(),
    effective_from: z.string().optional(),
    effective_to: z.string().optional(),
  })),
  services: z.array(z.object({
    service_id: z.string().uuid(),
    price_override: z.number().nullable(),
    duration_override: z.number().nullable(),
  })),
  actor_profile_id: z.string().uuid(),
});

export type StaffProfileInput = z.infer<typeof staffProfileSchema>;

export async function saveStaffProfile(supabase: ReturnType<typeof createClient>, payload: StaffProfileInput) {
  const input = staffProfileSchema.parse(payload);
  const { staffId, actor_profile_id, ...rest } = input;

  // Fetch the old staff row for audit
  const { data: oldStaff } = await supabase.from("app.staff").select("*").eq("id", staffId).maybeSingle();

  // Upsert staff core
  const staffObj = {
    ...rest,
    initials: rest.initials || generateInitials(rest.first_name, rest.last_name),
    phone: normalizePhone(rest.phone),
    updated_at: new Date().toISOString(),
  };
  
  let staffResult;
  if (staffId) {
    // Handle type issues with explicit type casting
    const { data, error } = await supabase
      .from("app.staff")
      .update(staffObj as any)
      .eq("id", staffId)
      .select()
      .single();
    
    if (error) throw error;
    staffResult = { data, error };
  } else {
    const { data, error } = await supabase
      .from("app.staff")
      .insert(staffObj as any)
      .select()
      .single();
    
    if (error) throw error;
    staffResult = { data, error };
  }
  
  const newStaff = staffResult.data;
  
  // Permissions
  await supabase.from("app.staff_permissions").delete().eq("staff_id", newStaff.id);
  if (rest.permissions.length) {
    const permissionData = rest.permissions.map(p => ({ 
      staff_id: newStaff.id, 
      ...p 
    }));
    
    await supabase
      .from("app.staff_permissions")
      .upsert(permissionData as any);
  }

  // Comp plan
  await supabase
    .from("app.comp_plans")
    .upsert({
      staff_id: newStaff.id,
      ...rest.compPlan,
      updated_at: new Date().toISOString(),
    } as any);

  // Team overrides
  await supabase.from("app.team_overrides").delete().or(`manager_id.eq.${newStaff.id},member_id.eq.${newStaff.id}`);
  if (rest.overrides.length) {
    await supabase
      .from("app.team_overrides")
      .upsert(rest.overrides.map(o => ({ ...o })) as any);
  }

  // Availability
  await supabase.from("app.staff_availability").delete().eq("staff_id", newStaff.id);
  if (rest.availability.length) {
    await supabase
      .from("app.staff_availability")
      .upsert(
        rest.availability.map(a => ({ staff_id: newStaff.id, ...a })) as any
      );
  }

  // Services
  await supabase.from("app.staff_services").delete().eq("staff_id", newStaff.id);
  if (rest.services.length) {
    await supabase
      .from("app.staff_services")
      .upsert(
        rest.services.map(s => ({ staff_id: newStaff.id, ...s })) as any
      );
  }

  // Audit event
  await supabase.from("app.staff_events").insert({
    staff_id: newStaff.id,
    event_type: staffId ? "updated" : "created",
    old: oldStaff || null,
    new: newStaff,
    actor_profile_id: actor_profile_id,
    created_at: new Date().toISOString(),
  });

  return { success: true, staff: newStaff };
}
