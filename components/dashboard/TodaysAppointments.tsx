"use client";
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import clsx from 'clsx'

interface Appointment {
  id: string
  time: string
  pet_name: string
  client_name: string
  status: string
}

const statusStyles: Record<string, string> = {
  Completed: 'bg-brand-mint/30 text-brand-navy',
  Upcoming: 'bg-brand-sunshine/70 text-brand-navy',
  Cancelled: 'bg-red-500/15 text-red-500',
  'In Progress': 'bg-brand-blue/10 text-brand-blue',
  'Checked In': 'bg-brand-lavender/20 text-brand-blue'
}

export default function TodaysAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Query the appointments scheduled for today. The Supabase table is expected
    // to have fields: id, scheduled_time, pet_name, client_name, status.
    const fetchAppointments = async () => {
      const start = new Date()
      start.setHours(0, 0, 0, 0)
      const end = new Date()
      end.setHours(23, 59, 59, 999)

      const { data, error } = await supabase
        .from('appointments')
        .select('id, scheduled_time, pet_name, client_name, status')
        .gte('scheduled_time', start.toISOString())
        .lte('scheduled_time', end.toISOString())
        .order('scheduled_time', { ascending: true })

      if (!error && data) {
        setAppointments(
          data.map((row) => ({
            id: row.id as string,
            time: new Date(row.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            pet_name: row.pet_name,
            client_name: row.client_name,
            status: row.status,
          }))
        )
      }
      setLoading(false)
    }
    fetchAppointments()
  }, [])

  if (loading) {
    return <div className="text-brand-navy/60">Loading...</div>
  }

  if (appointments.length === 0) {
    return (
      <div className="rounded-[1.85rem] border border-brand-navy/10 bg-white/85 p-6 text-sm text-brand-navy/70 shadow-[0_16px_40px_-35px_rgba(8,15,41,0.55)]">
        No appointments today.
      </div>
    )
  }

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-brand-navy">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.42em] text-brand-navy/50">Today</p>
          <h3 className="font-serif text-2xl font-semibold text-brand-navy">{today}</h3>
        </div>
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/10 text-lg font-semibold text-brand-blue shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
          {appointments.length}
        </span>
      </div>
      <ul className="space-y-3">
        {appointments.map((appt) => (
          <li
            key={appt.id}
            className="group relative grid grid-cols-[auto,1fr,auto] items-center gap-4 overflow-hidden rounded-[1.85rem] border border-brand-navy/5 bg-white/95 px-5 py-4 text-brand-navy shadow-[0_18px_35px_-30px_rgba(7,12,30,0.6)] transition-transform duration-200 hover:-translate-y-1"
          >
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-blue/5 text-2xl">
              🐶
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-navy">{appt.pet_name}</p>
              <p className="text-xs text-brand-navy/70">{appt.client_name}</p>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-brand-navy">{appt.time}</div>
              <span
                className={clsx(
                  'mt-3 inline-flex items-center justify-center rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.26em]',
                  statusStyles[appt.status] ?? 'bg-brand-blue/10 text-brand-blue'
                )}
              >
                {appt.status}
              </span>
            </div>
            <div className="pointer-events-none absolute inset-x-4 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-brand-blue/30 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
          </li>
        ))}
      </ul>
    </div>
  )
}
