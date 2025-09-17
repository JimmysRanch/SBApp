"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";

export async function saveSettings(formData: FormData) {
  const supabase = createServerClient();
  const id = Number(formData.get("id"));

  await supabase
    .from("employees")
    .update({
      name: formData.get("name") || null,
      role: formData.get("role") || null,
      email: formData.get("email") || null,
      phone: formData.get("phone") || null,
      address_street: formData.get("address_street") || null,
      address_city: formData.get("address_city") || null,
      address_state: formData.get("address_state") || null,
      address_zip: formData.get("address_zip") || null,
      pay_type: formData.get("pay_type") || null,
      commission_rate: formData.get("commission_rate") ? Number(formData.get("commission_rate")) : null,
      hourly_rate: formData.get("hourly_rate") ? Number(formData.get("hourly_rate")) : null,
    })
    .eq("id", id);

  const weeklyRevenueTarget = formData.get("weekly_revenue_target");
  const desiredDogsPerDay = formData.get("desired_dogs_per_day");

  await supabase.from("staff_goals").upsert({
    staff_id: id,
    weekly_revenue_target: weeklyRevenueTarget ? Number(weeklyRevenueTarget) : null,
    desired_dogs_per_day: desiredDogsPerDay ? Number(desiredDogsPerDay) : null,
  });

  revalidatePath(`/employees/${id}`);
  revalidatePath(`/employees/${id}/schedule`);
  revalidatePath("/employees");
}
