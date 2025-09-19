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

  if (loading) return <div className="flex items-center gap-2 text-white/80">💸 Counting sparkly tips...</div>
  return (
    <div className="space-y-5 text-white">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/20 bg-gradient-to-br from-electric-blue/25 via-electric-purple/25 to-electric-pink/25 p-6 shadow-[0_32px_65px_-28px_rgba(120,92,255,0.45)] backdrop-blur-2xl">
        <div className="pointer-events-none absolute -left-16 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full bg-white/20 blur-3xl" />
        <div className="pointer-events-none absolute right-[-10rem] top-0 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-[0.6rem] uppercase tracking-[0.5em] text-white/70">Today&apos;s Glow</p>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="font-display text-4xl uppercase tracking-[0.35em] drop-shadow-[0_10px_25px_rgba(0,0,0,0.35)]">
                ${format(todayRevenue)}
              </span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-[0.55rem] uppercase tracking-[0.35em] text-white/75">
                so far
              </span>
            </div>
            <p className="mt-3 text-sm text-white/75">Keep the dryers humming—today&apos;s total is shining bright.</p>
          </div>
          <span className="grid h-12 w-12 place-items-center rounded-3xl bg-white/15 text-lg text-white/80 shadow-inner">
            ✨
          </span>
        </div>
      </div>
      <div className="relative overflow-hidden rounded-[2rem] border border-white/20 bg-gradient-to-br from-electric-pink/25 via-electric-orange/25 to-electric-purple/25 p-6 shadow-[0_32px_65px_-28px_rgba(255,102,196,0.45)] backdrop-blur-2xl">
        <div className="pointer-events-none absolute -top-12 left-1/3 h-52 w-52 rounded-full bg-white/12 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 right-0 h-60 w-60 rounded-full bg-white/18 blur-3xl" />
        <div className="relative flex flex-col gap-3">
          <p className="text-[0.6rem] uppercase tracking-[0.5em] text-white/70">Week-To-Date</p>
          <span className="font-display text-3xl uppercase tracking-[0.35em] drop-shadow-[0_8px_22px_rgba(0,0,0,0.35)]">
            ${format(weekRevenue)}
          </span>
          <p className="text-sm text-white/75">That&apos;s a whole lot of wag-worthy sparkle for the crew.</p>
        </div>
      </div>
    </div>
  )
}
