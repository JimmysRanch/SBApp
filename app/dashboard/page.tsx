import { redirect } from 'next/navigation'
import { createClient } from '@/supabase/server'
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
      <div className="grid gap-6 md:grid-cols-3">
        <Widget
          title="Today's Appointments"
          color="blue"
          className="md:col-span-2 md:row-span-4"
          hideHeader
        >
          <TodaysAppointments />
        </Widget>
        <Widget title="Employee Workload" color="purple" className="md:col-start-3">
          <EmployeeWorkload />
        </Widget>
        <Widget title="Revenue" color="green" className="md:col-start-3">
          <Revenue />
        </Widget>
        <Widget title="Messages" color="purple" className="md:col-start-3">
          <Messages />
        </Widget>
        <Widget title="Quick Actions" color="pink" className="md:col-start-3">
          <div className="flex flex-col space-y-3">
            {[
              'Book Appointment',
              'Add Client',
              'Generate Report',
            ].map((label) => (
              <button
                key={label}
                className="group flex items-center justify-between rounded-2xl bg-white/95 px-5 py-3 text-left font-semibold text-brand-navy shadow-lg transition duration-200 hover:-translate-y-0.5 hover:bg-white"
              >
                <span>{label}</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-bubble text-lg text-white shadow-inner transition-transform duration-200 group-hover:scale-105">
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
