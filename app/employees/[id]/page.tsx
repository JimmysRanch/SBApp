import OverviewWidgets from '@/components/staff/OverviewWidgets';
import RecentJobs from '@/components/staff/RecentJobs';
import { createServerClient } from '@/lib/supabase/server';

type StaffOverviewProps = {
  params: { id: string };
};

export default async function StaffOverview({ params }: StaffOverviewProps) {
  const supabase = createServerClient();
  const staffId = params.id;

  const [{ data: today }, { data: weekly }, { data: lifetime }, { data: goals }] = await Promise.all([
    supabase.rpc('staff_today_metrics', { p_staff_id: staffId }),
    supabase.rpc('staff_week_metrics', { p_staff_id: staffId }),
    supabase.rpc('staff_lifetime_metrics', { p_staff_id: staffId }),
    supabase.from('staff_goals').select('*').eq('staff_id', staffId).maybeSingle(),
  ]);

  return (
    <div className="space-y-4">
      <OverviewWidgets today={today ?? null} weekly={weekly ?? null} lifetime={lifetime ?? null} goals={goals ?? null} />
      <RecentJobs staffId={staffId} limit={8} />
    </div>
  );
}
