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

  if (loading) return <div className="rounded-2xl border border-slate-200 bg-white/70 p-6 text-slate-500">Loading alerts…</div>
  if (!alerts.length) return <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 text-slate-500">All clear for now.</div>
  return (
    <ul className="space-y-2 rounded-3xl border border-slate-200 bg-white/90 p-4 text-sm text-brand-charcoal shadow-inner shadow-slate-200/40">
      {alerts.map((alert) => (
        <li key={alert.id} className="flex items-center gap-3">
          <span className="inline-flex h-2 w-2 flex-none rounded-full bg-secondary" />
          <span className="text-sm text-slate-600">{alert.message}</span>
        </li>
      ))}
    </ul>
  )
}
