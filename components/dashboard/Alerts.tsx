"use client";
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface Alert {
  id: string
  message: string
  created_at: string
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAlerts = async () => {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)
      if (!error && data) setAlerts(data as Alert[])
      setLoading(false)
    }
    fetchAlerts()
  }, [])

  if (loading) return <div className="text-slate-300">Loading...</div>
  if (!alerts.length)
    return (
      <div className="rounded-[1.75rem] border border-dashed border-white/15 bg-slate-950/40 p-6 text-sm text-slate-400 backdrop-blur">
        No alerts.
      </div>
    )
  return (
    <ul className="space-y-2 text-sm text-brand-cream">
      {alerts.map((alert) => (
        <li
          key={alert.id}
          className="rounded-[1.5rem] border border-white/10 bg-slate-950/60 px-4 py-3 shadow-[0_20px_40px_-30px_rgba(15,23,42,0.9)] backdrop-blur"
        >
          {alert.message}
        </li>
      ))}
    </ul>
  )
}
