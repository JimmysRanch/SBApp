import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PageContainer from '@/components/PageContainer'
import Widget from '@/components/Widget'
import TodaysAppointments from '@/components/dashboard/TodaysAppointments'
import EmployeeWorkload from '@/components/dashboard/EmployeeWorkload'
import Messages from '@/components/dashboard/Messages'
import Revenue from '@/components/dashboard/Revenue'
import Alerts from '@/components/dashboard/Alerts'

export const runtime = "nodejs"

export default async function DashboardPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return (
    <PageContainer>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Widget title="Today's Appointments" color="blue" hideHeader>
          <TodaysAppointments />
        </Widget>
        <Widget title="Employee Workload" color="purple">
          <EmployeeWorkload />
        </Widget>
        <Widget title="Revenue" color="green">
          <Revenue />
        </Widget>
        <Widget title="Messages" color="purple">
          <Messages />
        </Widget>
        <Widget title="Team Alerts" color="green">
          <Alerts />
        </Widget>
        <Widget title="Quick Actions" color="pink">
          <div className="flex flex-col space-y-3">
            {[
              'Book Appointment',
              'Add Client',
              'Generate Report',
            ].map((label) => (
              <button
                key={label}
                className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3 text-left font-semibold text-brand-charcoal shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary hover:text-primary"
              >
                <span>{label}</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary shadow-inner transition-transform duration-200 group-hover:scale-110">
                  →
                </span>
              </button>
            ))}
          </div>
        </Widget>
      </div>
    </PageContainer>
  )
}
