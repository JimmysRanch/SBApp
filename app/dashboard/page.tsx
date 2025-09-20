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
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
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
                className="group flex items-center justify-between rounded-2xl border border-white/8 bg-brand-onyx/70 px-5 py-3 text-left font-semibold text-brand-cream shadow-[0_26px_60px_-40px_rgba(5,12,32,0.9)] transition duration-200 hover:-translate-y-0.5 hover:border-white/15"
              >
                <span>{label}</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-bubble via-secondary.purple to-primary.light text-lg text-white shadow-[0_12px_35px_-15px_rgba(255,10,120,0.6)] transition-transform duration-200 group-hover:scale-105">
                  ↗
                </span>
              </button>
            ))}
          </div>
        </Widget>
      </div>
    </PageContainer>
  )
}
