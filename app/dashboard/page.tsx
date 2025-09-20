import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PageContainer from '@/components/PageContainer'
import Widget from '@/components/Widget'
import TodaysAppointments from '@/components/dashboard/TodaysAppointments'
import EmployeeWorkload from '@/components/dashboard/EmployeeWorkload'
import Messages from '@/components/dashboard/Messages'
import Revenue from '@/components/dashboard/Revenue'

export const runtime = "nodejs"

export default async function DashboardPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return (
    <PageContainer>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
        <Widget title="Quick Actions" color="pink">
          <div className="flex flex-col space-y-3">
            {[
              'Book Appointment',
              'Add Client',
              'Generate Report',
            ].map((label) => (
              <button
                key={label}
                className="group flex items-center justify-between rounded-[1.75rem] border border-white/10 bg-slate-950/60 px-5 py-4 text-left font-semibold text-brand-cream shadow-[0_24px_55px_-35px_rgba(15,23,42,0.9)] transition duration-200 hover:-translate-y-1 hover:border-brand-bubble/60 hover:bg-slate-900/60"
              >
                <span className="flex items-center gap-2 text-sm uppercase tracking-[0.35em] text-slate-300">
                  <span className="h-2 w-2 rounded-full bg-brand-bubble" />
                  {label}
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-bubble/60 bg-brand-bubble/15 text-lg text-brand-cream shadow-[0_10px_25px_-18px_rgba(34,211,238,0.7)] transition-transform duration-200 group-hover:scale-110">
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
