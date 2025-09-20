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

  if (loading) return <div className="text-brand-cream/70">Loading...</div>
  return (
    <div className="space-y-4 text-brand-cream">
      <div className="rounded-3xl border border-white/10 bg-brand-onyx/70 p-5 shadow-[0_24px_60px_-40px_rgba(5,12,32,0.9)] backdrop-blur">
        <p className="text-xs uppercase tracking-[0.35em] text-brand-cream/60">Today</p>
        <div className="mt-2 flex items-end gap-2">
          <span className="text-3xl font-bold drop-shadow-sm">${format(todayRevenue)}</span>
          <span className="text-xs text-brand-cream/60">so far</span>
        </div>
      </div>
      <div className="rounded-3xl border border-white/10 bg-brand-onyx/70 p-5 shadow-[0_24px_60px_-40px_rgba(5,12,32,0.9)] backdrop-blur">
        <p className="text-xs uppercase tracking-[0.35em] text-brand-cream/60">This Week</p>
        <div className="mt-2 text-xl font-semibold drop-shadow-sm">${format(weekRevenue)}</div>
      </div>
    </div>
  )
}
