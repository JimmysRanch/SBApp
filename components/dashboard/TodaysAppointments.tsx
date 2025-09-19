"use client";
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import clsx from 'clsx'

interface Appointment {
  id: string
  timeLabel: string
  petName: string
  clientName: string
  statusLabel: string
  statusClass: string
}

const STATUS_STYLE_DEFAULT = 'bg-white/40 text-brand-navy'
const STATUS_STYLE_COMPLETED = 'bg-brand-mint/30 text-brand-navy'
const STATUS_STYLE_ACTIVE = 'bg-brand-sunshine/60 text-brand-navy'
const STATUS_STYLE_ALERT = 'bg-brand-bubble/40 text-white'
const STATUS_STYLE_CHECKED = 'bg-brand-lavender/40 text-white'

const statusStyles: Record<string, string> = {
  completed: STATUS_STYLE_COMPLETED,
  scheduled: STATUS_STYLE_DEFAULT,
  upcoming: STATUS_STYLE_DEFAULT,
  booked: STATUS_STYLE_DEFAULT,
  checked_in: STATUS_STYLE_CHECKED,
  in_progress: STATUS_STYLE_ACTIVE,
  cancelled: STATUS_STYLE_ALERT,
  canceled: STATUS_STYLE_ALERT,
  no_show: STATUS_STYLE_ALERT,
}

function normalizeStatus(raw: string | null | undefined) {
  if (!raw) return 'scheduled'
  return raw.toString().trim().toLowerCase().replace(/[\s-]+/g, '_')
}

function formatStatusLabel(raw: string | null | undefined) {
  const normalized = normalizeStatus(raw)
  const parts = normalized.split('_').filter(Boolean)
  if (parts.length === 0) return 'Scheduled'
  return parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
}

function getStatusClass(key: string) {
  if (statusStyles[key]) return statusStyles[key]
  if (key.includes('cancel') || key.includes('no_show')) return STATUS_STYLE_ALERT
  if (key.includes('progress')) return STATUS_STYLE_ACTIVE
  if (key.includes('checked')) return STATUS_STYLE_CHECKED
  if (key.includes('complete')) return STATUS_STYLE_COMPLETED
  return STATUS_STYLE_DEFAULT
}

function formatTimeLabel(iso: string | null | undefined) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function readRelationField(relation: unknown, field: string): string | null {
  if (Array.isArray(relation)) {
    for (const item of relation) {
      if (item && typeof item === 'object') {
        const value = (item as Record<string, unknown>)[field]
        if (typeof value === 'string') {
          const trimmed = value.trim()
          if (trimmed) return trimmed
        }
      }
    }
    return null
  }
  if (relation && typeof relation === 'object') {
    const value = (relation as Record<string, unknown>)[field]
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed) return trimmed
    }
  }
  return null
}

function firstString(...values: Array<string | null | undefined>) {
  for (const value of values) {
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed) return trimmed
    }
  }
  return null
}

export default function TodaysAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const fetchAppointments = async () => {
      setLoading(true)
      setError(null)
      try {
        const start = new Date()
        start.setHours(0, 0, 0, 0)
        const end = new Date()
        end.setHours(23, 59, 59, 999)

        const { data, error } = await supabase
          .from('appointments')
          .select(`
            id,
            start_time,
            status,
            pet_name,
            owner_name,
            client:clients(full_name),
            pet:pets(name)
          `)
          .gte('start_time', start.toISOString())
          .lte('start_time', end.toISOString())
          .order('start_time', { ascending: true })

        if (error) throw error

        const mapped: Appointment[] = (data ?? []).map((row: any) => {
          const statusKey = normalizeStatus(row.status)
          const startTime: string | null = row.start_time ?? null
          const petName =
            firstString(
              row.pet_name,
              readRelationField(row.pet, 'name'),
              readRelationField(row.pets, 'name')
            ) ?? 'Unknown pet'
          const clientName =
            firstString(
              row.owner_name,
              readRelationField(row.client, 'full_name'),
              readRelationField(row.clients, 'full_name')
            ) ?? 'No client on file'

          return {
            id: String(row.id),
            timeLabel: formatTimeLabel(startTime),
            petName,
            clientName,
            statusLabel: formatStatusLabel(row.status),
            statusClass: getStatusClass(statusKey),
          }
        })

        if (!active) return
        setAppointments(mapped)
      } catch (cause) {
        console.error('Failed to load today\'s appointments', cause)
        if (!active) return
        setAppointments([])
        setError('Unable to load today\'s appointments.')
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void fetchAppointments()
    return () => {
      active = false
    }
  }, [])

  if (loading) {
    return <div className="text-white/80">Loading...</div>
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-white/30 bg-white/10 p-6 text-white/80 backdrop-blur-md">
        {error}
      </div>
    )
  }

  if (appointments.length === 0) {
    return (
      <div className="rounded-3xl border border-white/30 bg-white/10 p-6 text-white/80 backdrop-blur-md">
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
      <div className="flex items-center justify-between text-white">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-white/70">Today</p>
          <h3 className="text-2xl font-semibold tracking-tight drop-shadow-sm">{today}</h3>
        </div>
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/25 text-lg font-semibold text-white shadow-inner">
          {appointments.length}
        </span>
      </div>
      <ul className="space-y-3">
        {appointments.map((appt) => (
          <li
            key={appt.id}
            className="grid grid-cols-[auto,1fr,auto] items-center gap-4 rounded-3xl bg-white/95 px-5 py-4 text-brand-navy shadow-lg shadow-primary/10 backdrop-blur"
          >
            <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-bubble/20 text-2xl">
              🐶
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-navy">{appt.petName}</p>
              <p className="text-xs text-brand-navy/70">{appt.clientName}</p>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-brand-navy">{appt.timeLabel}</div>
              <span
                className={clsx(
                  'mt-2 inline-flex items-center justify-center rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide',
                  appt.statusClass
                )}
              >
                {appt.statusLabel}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
