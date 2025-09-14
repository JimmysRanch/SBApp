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
    <PageContainer className="overflow-hidden">
      <h1 className="text-3xl font-bold text-primary-dark">Dashboard</h1>
      <div className="grid flex-1 gap-6 md:grid-cols-4 md:grid-rows-2">
        <Widget title="Today's Appointments" color="blue" className="md:col-span-2 md:row-span-2">
          <TodaysAppointments />
        </Widget>
        <Widget title="Employee Workload" color="green" className="md:col-start-3 md:row-start-1">
          <EmployeeWorkload />
        </Widget>
        <Widget title="Revenue" color="purple" className="md:col-start-4 md:row-start-1">
          <Revenue />
        </Widget>
        <Widget title="Quick Actions" color="pink" className="md:col-start-3 md:row-start-2">
          <div className="flex flex-col space-y-2">
            <button className="rounded-full bg-primary px-4 py-2 text-white">Book Appointment</button>
            <button className="rounded-full bg-primary px-4 py-2 text-white">Add Client</button>
            <button className="rounded-full bg-primary px-4 py-2 text-white">Generate Report</button>
          </div>
        </Widget>
        <Widget title="Messages" color="purple" className="md:col-start-4 md:row-start-2">
          <Messages />
        </Widget>
      </div>
    </PageContainer>
  )
}
