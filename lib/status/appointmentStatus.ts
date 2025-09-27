export type CanonicalStatus = 'scheduled' | 'finished' | 'no_show' | 'canceled'

export interface DerivedStatus {
  canonical: CanonicalStatus
  display: string
  isDerived: boolean
  phase: 'scheduled' | 'checked_in' | 'in_progress' | 'finished' | 'canceled' | 'no_show'
}

/**
 * Derive UI status with a 10-minute grace window:
 * - Checked In: scheduled AND now in [start_at, start_at + 10m)
 * - In Progress: scheduled AND now in [start_at + 10m, end_at)
 * - Completed: finished
 * - Canceled: canceled
 * - No Show: no_show
 * - Scheduled: otherwise (status=scheduled outside time windows)
 */
export function deriveAppointmentStatus(
  canonical: CanonicalStatus,
  startAt?: string | null,
  endAt?: string | null,
  now: Date = new Date()
): DerivedStatus {
  if (canonical === 'finished') {
    return { canonical, display: 'Completed', isDerived: false, phase: 'finished' }
  }
  if (canonical === 'canceled') {
    return { canonical, display: 'Canceled', isDerived: false, phase: 'canceled' }
  }
  if (canonical === 'no_show') {
    return { canonical, display: 'No Show', isDerived: false, phase: 'no_show' }
  }

  const start = startAt ? new Date(startAt) : null
  const end = endAt ? new Date(endAt) : null

  if (start && !isNaN(start.getTime())) {
    const graceEnd = new Date(start.getTime() + 10 * 60 * 1000) // +10m
    if (now >= start && now < graceEnd) {
      return {
        canonical,
        display: 'Checked In',
        isDerived: true,
        phase: 'checked_in'
      }
    }
    if (now >= graceEnd && end && now < end) {
      return {
        canonical,
        display: 'In Progress',
        isDerived: true,
        phase: 'in_progress'
      }
    }
  }

  return {
    canonical,
    display: 'Scheduled',
    isDerived: false,
    phase: 'scheduled'
  }
}

export function mapAppointmentsWithDerived<T extends {
  status: string
  start_at?: string | null
  end_at?: string | null
}>(rows: T[], now: Date = new Date()) {
  return rows.map(r => {
    const canonical = (r.status as CanonicalStatus)
    const derived = deriveAppointmentStatus(canonical, r.start_at, r.end_at, now)
    return { ...r, derived_status: derived }
  })
}