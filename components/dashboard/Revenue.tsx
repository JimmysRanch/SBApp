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

  if (loading) return <div className="text-brand-navy/60">Loading...</div>
  return (
    <div className="space-y-4 text-brand-navy">
      <div className="relative overflow-hidden rounded-[1.95rem] border border-brand-navy/10 bg-white/95 p-6 shadow-[0_18px_35px_-30px_rgba(7,12,30,0.55)]">
        <div className="pointer-events-none absolute -top-12 right-0 h-32 w-32 rounded-full bg-brand-blue/20 blur-[90px]" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.42em] text-brand-navy/50">Today</p>
        <div className="mt-3 flex items-end gap-2">
          <span className="font-serif text-3xl font-semibold text-brand-navy">${format(todayRevenue)}</span>
          <span className="text-xs text-brand-navy/50">so far</span>
        </div>
      </div>
      <div className="relative overflow-hidden rounded-[1.95rem] border border-brand-navy/10 bg-white/95 p-6 shadow-[0_18px_35px_-30px_rgba(7,12,30,0.55)]">
        <div className="pointer-events-none absolute -bottom-12 left-0 h-32 w-32 rounded-full bg-brand-mint/25 blur-[90px]" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.42em] text-brand-navy/50">This Week</p>
        <div className="mt-3 font-serif text-2xl font-semibold text-brand-navy">${format(weekRevenue)}</div>
      </div>
    </div>
  )
}
