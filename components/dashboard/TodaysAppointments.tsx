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
  Completed: 'bg-electric-lime/80 text-brand-navy',
  Upcoming: 'bg-white/90 text-brand-navy',
  Cancelled: 'bg-electric-pink/85 text-white',
  'In Progress': 'bg-electric-orange/80 text-brand-navy',
  'Checked In': 'bg-electric-aqua/85 text-brand-navy'
}

const petEmojis = ['🐶', '🐱', '🐕‍🦺', '🛁', '🐩', '🎉', '🦄', '🐾']

const emojiForAppointment = (id: string, petName: string) => {
  const seed = `${id}-${petName}`
  const code = Array.from(seed).reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return petEmojis[code % petEmojis.length]
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
    return <div className="flex items-center gap-2 text-white/80">✨ Loading the party schedule...</div>
  }

  if (appointments.length === 0) {
    return (
      <div className="rounded-[2rem] border border-dashed border-white/40 bg-white/10 p-6 text-center text-white/75 backdrop-blur-xl">
        No appointments today—time to plan a surprise spa party! 🥳
      </div>
    )
  }

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="space-y-6 text-white">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[0.6rem] uppercase tracking-[0.5em] text-white/70">Today</p>
          <h3 className="font-display text-3xl uppercase tracking-[0.35em] drop-shadow-[0_8px_22px_rgba(0,0,0,0.35)]">{today}</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-white/15 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.4em] text-white/75">
            {appointments.length} Slots
          </span>
          <span className="grid h-14 w-14 place-items-center rounded-3xl bg-gradient-to-br from-electric-pink via-electric-orange to-electric-purple text-2xl shadow-[0_24px_45px_-24px_rgba(120,92,255,0.5)]">
            ✂️
          </span>
        </div>
      </div>
      <p className="text-sm text-white/75">
        Roll out the confetti! We&apos;re pampering <span className="font-semibold text-white">{appointments.length}</span> party animals today.
      </p>
      <ul className="space-y-4">
        {appointments.map((appt) => {
          const emoji = emojiForAppointment(appt.id, appt.pet_name)
          return (
            <li
              key={appt.id}
              className="group relative overflow-hidden rounded-[2rem] border border-white/20 bg-gradient-to-r from-white/20 via-white/10 to-white/5 p-5 text-white shadow-[0_30px_60px_-28px_rgba(120,92,255,0.45)] backdrop-blur-2xl"
            >
              <div className="pointer-events-none absolute -left-20 top-1/2 h-56 w-56 -translate-y-1/2 rotate-12 rounded-full bg-white/15 blur-3xl transition duration-500 group-hover:rotate-0 group-hover:scale-110" />
              <div className="pointer-events-none absolute right-[-3rem] top-[-3rem] h-36 w-36 rounded-full bg-white/10 blur-3xl" />
              <div className="relative flex flex-wrap items-center gap-5">
                <div className="grid h-14 w-14 place-items-center rounded-3xl bg-white text-2xl text-brand-navy shadow-inner">
                  {emoji}
                </div>
                <div className="flex min-w-[160px] flex-1 flex-col gap-1">
                  <p className="font-display text-lg uppercase tracking-[0.25em] drop-shadow">{appt.pet_name}</p>
                  <p className="text-sm text-white/75">with {appt.client_name}</p>
                </div>
                <div className="flex flex-1 flex-col items-end gap-2 text-right sm:max-w-[160px]">
                  <span className="rounded-full bg-white/20 px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.4em] text-white">
                    {appt.time}
                  </span>
                  <span
                    className={clsx(
                      'inline-flex items-center gap-2 rounded-full px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.4em]',
                      statusStyles[appt.status] ?? 'bg-white/80 text-brand-navy'
                    )}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
                    {appt.status}
                  </span>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
