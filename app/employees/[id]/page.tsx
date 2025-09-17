import { createServerClient } from "@/lib/supabase/server";
import OverviewWidgets from "@/components/staff/OverviewWidgets";
import RecentJobs from "@/components/staff/RecentJobs";
import StaffHeader from "@/components/staff/StaffHeader";
import StaffTabs from "@/components/staff/StaffTabs";

interface StaffOverviewProps {
  params: { id: string };
}

export default async function StaffOverview({ params }: StaffOverviewProps) {
  const supabase = createServerClient();
  const staffId = Number(params.id);

  const { data: staff } = await supabase
    .from("employees")
    .select(
      "id, name, email, phone, active, role, address_street, address_city, address_state, address_zip, avatar_url",
    )
    .eq("id", staffId)
    .single();

  const [todayResult, weeklyResult, lifetimeResult, goalsResult] = await Promise.all([
    supabase.rpc("staff_today_metrics", { p_staff_id: staffId }),
    supabase.rpc("staff_week_metrics", { p_staff_id: staffId }),
    supabase.rpc("staff_lifetime_metrics", { p_staff_id: staffId }),
    supabase.from("staff_goals").select("*").eq("staff_id", staffId).maybeSingle(),
  ]);

  const today = todayResult.data?.[0] ?? null;
  const weekly = weeklyResult.data?.[0] ?? null;
  const lifetime = lifetimeResult.data?.[0] ?? null;
  const goals = goalsResult.data;

  if (!staff) {
    return <div className="p-6">Staff not found.</div>;
  }

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-xl border bg-white p-4">
        <StaffHeader staff={staff} />
        <StaffTabs staffId={String(staffId)} />
      </div>
      <OverviewWidgets today={today} weekly={weekly} lifetime={lifetime} goals={goals} />
      <RecentJobs staffId={String(staffId)} limit={8} />
    </div>
  );
}
