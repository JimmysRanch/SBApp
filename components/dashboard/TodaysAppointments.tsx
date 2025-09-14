"use client";
import { useEffect, useState } from 'react'
import { getDemoAppointments } from '@/lib/demoData'

interface Appointment {
  id: string
  time: string
  pet_name: string
  client_name: string
  status: string
}

export default function TodaysAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])

  useEffect(() => {
    const today = new Date().toDateString()
    const demos = getDemoAppointments()
      .filter((a) => a.start.toDateString() === today)
      .map((a) => ({
        id: a.id,
        time: a.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        pet_name: a.petName,
        client_name: a.clientName,
        status: a.status,
      }))
    setAppointments(demos)
  }, [])

  if (appointments.length === 0) {
    return <div>No appointments today.</div>
  }

  const statusStyles: Record<string, string> = {
    Completed: 'bg-green-100 text-green-700',
    Upcoming: 'bg-sky-100 text-sky-700',
    'In Progress': 'bg-blue-100 text-blue-700',
    Cancelled: 'bg-gray-200 text-gray-600',
  }

  return (
    <ul className="space-y-2">
      {appointments.map((appt) => (
        <li
          key={appt.id}
          className="flex items-center justify-between rounded-lg bg-white/80 p-2"
        >
          <div className="flex items-center space-x-2">
            <span className="text-xl">🐶</span>
            <div>
              <p className="font-semibold">{appt.pet_name}</p>
              <p className="text-xs text-gray-600">{appt.client_name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">{appt.time}</span>
            <span
              className={`rounded-full px-2 py-1 text-xs font-semibold ${
                statusStyles[appt.status] || 'bg-gray-200 text-gray-600'
              }`}
            >
              {appt.status}
            </span>
          </div>
        </li>
      ))}
    </ul>
  )
}
