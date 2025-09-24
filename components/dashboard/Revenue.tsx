import { createClient } from '@/lib/supabase/server'

type RevenueRow = {
  total_price: number | null
}

function format(value: number) {
  return value.toFixed(2)
}

export default async function Revenue() {
  const now = new Date()
  const startOfDay = new Date(now)
  startOfDay.setHours(0, 0, 0, 0)

  const startOfWeek = new Date(now)
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Monday = 1
  startOfWeek.setDate(diff)
  startOfWeek.setHours(0, 0, 0, 0)

  const supabase = createClient()
  const { data: todayData } = await supabase
    .from('appointments')
    .select('total_price')
    .gte('completed_at', startOfDay.toISOString())
    .lte('completed_at', now.toISOString())
    .eq('status', 'Completed')

  const { data: weekData } = await supabase
    .from('appointments')
    .select('total_price')
    .gte('completed_at', startOfWeek.toISOString())
    .lte('completed_at', now.toISOString())
    .eq('status', 'Completed')

  const sum = (rows: RevenueRow[] | null | undefined) =>
    rows?.reduce((acc, row) => acc + (row.total_price ?? 0), 0) ?? 0

  const todayRevenue = sum(todayData)
  const weekRevenue = sum(weekData)

  return (
    <div className="space-y-4 text-white">
      <div className="rounded-3xl border border-white/20 bg-white/10 p-5 shadow-inner backdrop-blur">
        <p className="text-xs uppercase tracking-[0.35em] text-white/70">Today</p>
        <div className="mt-2 flex items-end gap-2">
          <span className="text-3xl font-bold drop-shadow-sm">${format(todayRevenue)}</span>
          <span className="text-xs text-white/70">so far</span>
        </div>
      </div>
      <div className="rounded-3xl border border-white/20 bg-white/10 p-5 shadow-inner backdrop-blur">
        <p className="text-xs uppercase tracking-[0.35em] text-white/70">This Week</p>
        <div className="mt-2 text-xl font-semibold drop-shadow-sm">${format(weekRevenue)}</div>
      </div>
    </div>
  )
}
