import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PageContainer from '@/components/PageContainer'
import Widget from '@/components/Widget'
import TodaysAppointments from '@/components/dashboard/TodaysAppointments'
import EmployeeWorkload from '@/components/dashboard/EmployeeWorkload'
import Messages from '@/components/dashboard/Messages'
import Revenue from '@/components/dashboard/Revenue'

export default async function DashboardPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return (
    <PageContainer>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="flex flex-col space-y-6">
          <Widget title="Today's Appointments" color="pink">
            <TodaysAppointments />
          </Widget>
          <Widget title="Messages" color="purple">
            <Messages />
          </Widget>
        </div>
        <div className="flex flex-col space-y-6">
          <Widget title="Employee Workload" color="green">
            <EmployeeWorkload />
          </Widget>
          <Widget title="Quick Actions" color="pink">
            <div className="flex flex-col space-y-2">
              <button className="rounded-full bg-primary px-4 py-2 text-white">Book Appointment</button>
              <button className="rounded-full bg-primary px-4 py-2 text-white">Add Client</button>
              <button className="rounded-full bg-primary px-4 py-2 text-white">Generate Report</button>
            </div>
          </Widget>
        </div>
        <div className="flex flex-col space-y-6">
          <Widget title="Revenue" color="purple">
            <Revenue />
          </Widget>
        </div>
      </div>
    </PageContainer>
  )
}
