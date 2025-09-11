import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PageContainer from '@/components/PageContainer'
import Widget from '@/components/Widget'
import TodaysAppointments from '@/components/dashboard/TodaysAppointments'
import EmployeeWorkload from '@/components/dashboard/EmployeeWorkload'
import Messages from '@/components/dashboard/Messages'
import Revenue from '@/components/dashboard/Revenue'
import Alerts from '@/components/dashboard/Alerts'

export default async function DashboardPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return (
    <PageContainer>
      <h1 className="text-3xl font-bold text-primary-dark">Dashboard</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Widget title="Today's Appointments" color="pink">
          <TodaysAppointments />
        </Widget>
        <Widget title="Revenue" color="purple">
          <Revenue />
        </Widget>
        <Widget title="Employee Workload" color="green">
          <EmployeeWorkload />
        </Widget>
        <Widget title="Messages" color="purple">
          <Messages />
        </Widget>
        <Widget title="Alerts" color="pink">
          <Alerts />
        </Widget>
      </div>
    </PageContainer>
  )
}
