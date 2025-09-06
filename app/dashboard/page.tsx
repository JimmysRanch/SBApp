import Sidebar from '@/components/Sidebar'
import Widget from '@/components/Widget'
import TodaysAppointments from '@/components/dashboard/TodaysAppointments'
import EmployeeWorkload from '@/components/dashboard/EmployeeWorkload'
import Revenue from '@/components/dashboard/Revenue'
import Alerts from '@/components/dashboard/Alerts'
import Messages from '@/components/dashboard/Messages'

export default function DashboardPage() {
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
  )
}