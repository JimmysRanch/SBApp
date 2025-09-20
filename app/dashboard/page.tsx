import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PageContainer from '@/components/PageContainer'
import Widget from '@/components/Widget'
import TodaysAppointments from '@/components/dashboard/TodaysAppointments'
import EmployeeWorkload from '@/components/dashboard/EmployeeWorkload'
import Messages from '@/components/dashboard/Messages'
import Revenue from '@/components/dashboard/Revenue'
import DashboardDynamicDemo from '@/components/DashboardDynamicDemo'

export const runtime = "nodejs"

export default async function DashboardPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return (
    <PageContainer>
      <div className="space-y-8">
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-lg font-semibold text-white drop-shadow">Dynamic Dashboard Preview</h1>
            <span className="text-xs uppercase tracking-[0.3em] text-white/50">Experimental</span>
          </div>
          <DashboardDynamicDemo />
        </section>
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
      </div>
    </PageContainer>
  )
}
