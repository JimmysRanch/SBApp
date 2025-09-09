import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const cookieStore = cookies();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${cookieStore.get('sb-access-token')?.value ?? ''}` } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // ...your existing dashboard JSX below
}
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 space-y-6 overflow-auto">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Widget title="Today's Appointments" color="pink">
            <TodaysAppointments />
          </Widget>
          <Widget title="Employee Workload" color="purple">
            <EmployeeWorkload />
          </Widget>
          <Widget title="Revenue" color="green">
            <Revenue />
          </Widget>
          <Widget title="Alerts" color="pink">
            <Alerts />
          </Widget>
          <Widget title="Messages" color="purple">
            <Messages />
          </Widget>
        </div>
      </main>
    </div>
  );
}
