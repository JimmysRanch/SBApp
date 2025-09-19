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
        <Widget title="Quick Actions" color="pink">
          <div className="flex flex-col space-y-3">
            {[
              'Book Appointment',
              'Add Client',
              'Generate Report',
            ].map((label) => (
              <button
                key={label}
                className="group relative flex items-center justify-between overflow-hidden rounded-[1.7rem] border border-brand-navy/5 bg-white/95 px-6 py-4 text-left font-semibold text-brand-navy shadow-[0_18px_35px_-30px_rgba(7,12,30,0.55)] transition-transform duration-200 hover:-translate-y-1"
              >
                <span className="relative z-10">{label}</span>
                <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue via-brand-mint to-secondary text-lg text-white shadow-[0_12px_25px_rgba(79,104,255,0.45)] transition-transform duration-200 group-hover:scale-105">
                  →
                </span>
                <span className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-brand-blue/10 via-transparent to-brand-bubble/10 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
              </button>
            ))}
          </div>
        </Widget>
      </div>
    </PageContainer>
  )
}
