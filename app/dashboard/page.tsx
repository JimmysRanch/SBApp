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

  const quickActions = [
    {
      label: 'Book Appointment',
      description: 'Launch a glam session for a fresh-faced pup.',
      icon: '🎟️'
    },
    {
      label: 'Add Client',
      description: 'Welcome a brand-new furry friend to the squad.',
      icon: '🐾'
    },
    {
      label: 'Generate Report',
      description: 'Pull dazzling numbers for the team celebration.',
      icon: '📈'
    },
    {
      label: 'Send Message',
      description: 'Blast a hype note to the crew or a VIP human.',
      icon: '📣'
    }
  ]
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {quickActions.map((action) => (
              <button
                key={action.label}
                type="button"
                className="group relative overflow-hidden rounded-2xl border border-white/25 bg-gradient-to-r from-white/90 via-white/80 to-white/60 p-4 text-left text-brand-navy shadow-[0_24px_50px_-26px_rgba(255,102,196,0.45)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_32px_60px_-24px_rgba(255,102,196,0.55)]"
              >
                <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-brand-bubble/25 blur-3xl transition duration-500 group-hover:scale-125" />
                <div className="relative flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-electric-pink via-electric-orange to-electric-purple text-xl text-white shadow-[0_20px_35px_-20px_rgba(120,92,255,0.5)]">
                      {action.icon}
                    </span>
                    <span className="text-sm font-semibold uppercase tracking-[0.35em] text-brand-navy/60">Go</span>
                  </div>
                  <span className="font-display text-base uppercase tracking-[0.3em] text-brand-navy">
                    {action.label}
                  </span>
                  <p className="text-sm text-brand-navy/70">{action.description}</p>
                </div>
              </button>
            ))}
          </div>
        </Widget>
      </div>
    </PageContainer>
  )
}
