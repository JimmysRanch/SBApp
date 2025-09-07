"use client";
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

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

  if (loading) return <div>Loading...</div>
  if (!alerts.length) return <div>No alerts.</div>
  return (
    <ul className="space-y-1 list-disc list-inside text-sm">
      {alerts.map((alert) => (
        <li key={alert.id}>{alert.message}</li>
      ))}
    </ul>
  )
}
