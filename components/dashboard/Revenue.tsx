"use client";
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function Revenue() {
  const [todayRevenue, setTodayRevenue] = useState<number | null>(null)
  const [weekRevenue, setWeekRevenue] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRevenue = async () => {
      const now = new Date()
      const startOfDay = new Date(now)
      startOfDay.setHours(0, 0, 0, 0)
      const startOfWeek = new Date(now)
      const day = now.getDay()
      const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Monday = 1
      startOfWeek.setDate(diff)
      startOfWeek.setHours(0, 0, 0, 0)

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

      const sum = (rows: any[] | null) => rows?.reduce((acc, row) => acc + (row.total_price || 0), 0) ?? 0
      setTodayRevenue(sum(todayData))
      setWeekRevenue(sum(weekData))
      setLoading(false)
    }
    fetchRevenue()
  }, [])

  const format = (value: number | null) => (value ?? 0).toFixed(2)

  if (loading) return <div className="text-white/80">Loading...</div>
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
