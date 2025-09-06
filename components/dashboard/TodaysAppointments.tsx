"use client";

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface Appointment {
  id: string
  time: string
  pet_name: string
  client_name: string
  status: string
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
    return <div>Loading...</div>
  }

  if (appointments.length === 0) {
    return <div>No appointments today.</div>
  }

  return (
    <ul className="space-y-2">
      {appointments.map((appt) => (
        <li key={appt.id} className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className="font-medium">{appt.time}</span>
            <span>{appt.pet_name}</span>
            <span className="text-sm text-gray-500">{appt.client_name}</span>
          </div>
          <span className={
            appt.status === 'Completed'
              ? 'text-green-600'
              : appt.status === 'Cancelled'
              ? 'text-orange-600'
              : appt.status === 'In Progress'
              ? 'text-green-500'
              : appt.status === 'Checked In'
              ? 'text-blue-600'
              : 'text-gray-600'
          }>
            {appt.status}
          </span>
        </li>
      ))}
    </ul>
  )
}
