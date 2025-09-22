"use client"

import { useEffect, useState } from "react"
import clsx from "clsx"
import { supabase } from "@/lib/supabase/client"

// Task categories displayed in the workload breakdown.
type TaskCategory = "baths" | "grooms" | "addons" | "other"

type TaskMix = Record<TaskCategory, number>

type StaffSummary = {
  id: string
  name: string
  dogsTotal: number
  dogsCompleted: number
  estimatedMinutes: number
  actualMinutes: number
  avgDiff: number | null
  utilization: number | null
  utilizationStatus: "low" | "ideal" | "high" | "none"
  taskMix: TaskMix
  remainingDogs: number
  remainingMinutes: number
  shiftMinutes: number | null
  shiftDataAvailable: boolean
}

type AppointmentRow = {
  id: string
  employeeId: string | null
  assigneeId: string
  assigneeName: string
  status: string
  startTime: Date | null
  endTime: Date | null
  estimatedMinutes: number
  actualMinutes: number | null
  serviceCategory: TaskCategory
  serviceName: string | null
}

type ServiceMeta = {
  id: string
  name: string | null
  minutes: number | null
  category: string | null
}

type StaffRecord = {
  id: string
  name: string
}

const mixColors: Record<TaskCategory, string> = {
  baths: "bg-sky-300/80",
  grooms: "bg-fuchsia-300/80",
  addons: "bg-amber-300/90",
  other: "bg-white/40"
}

const mixLabels: Record<TaskCategory, string> = {
  baths: "Baths",
  grooms: "Full Grooms",
  addons: "Add-ons",
  other: "Other"
}

const statusMap: Record<string, "completed" | "progress" | "scheduled" | "cancelled"> = {
  completed: "completed",
  complete: "completed",
  checked_out: "completed",
  checkedout: "completed",
  done: "completed",
  finished: "completed",
  in_progress: "progress",
  inprogress: "progress",
  checked_in: "progress",
  checkedin: "progress",
  started: "progress",
  working: "progress",
  booked: "scheduled",
  scheduled: "scheduled",
  upcoming: "scheduled",
  confirmed: "scheduled",
  pending: "scheduled",
  cancelled: "cancelled",
  canceled: "cancelled",
  no_show: "cancelled",
  "no-show": "cancelled",
  noshow: "cancelled",
  declined: "cancelled"
}

async function fetchAppointmentsForDay(startISO: string, endISO: string) {
  try {
    const columnsToTry = [
      { column: "start_time", order: "start_time" },
      { column: "scheduled_time", order: "scheduled_time" },
      { column: "starts_at", order: "starts_at" },
      { column: "start_at", order: "start_at" },
      { column: "start", order: "start" },
      { column: "appointment_date", order: "appointment_date" },
      { column: "date", order: "date" }
    ]

    const seen = new Map<string, any>()
    let attempted = false

    for (const attempt of columnsToTry) {
      const rows = await fetchAppointmentsByColumn(attempt.column, startISO, endISO, attempt.order)
      if (rows === null) {
        continue
      }
      attempted = true
      for (const row of rows) {
        if (!row) continue
        const id = row.id
        if (id === null || id === undefined) continue
        const key = String(id)
        if (seen.has(key)) continue
        seen.set(key, row)
      }
    }

    if (!attempted) {
      const fallback = await supabase.from("appointments").select("*").order("id", { ascending: true }).limit(200)
      if (fallback.error) {
        if (
          isMissingRelationError(fallback.error) ||
          isMissingColumnError(fallback.error) ||
          isPermissionDeniedError(fallback.error)
        ) {
          return []
        }
        logSuppressedError("appointments", fallback.error)
        return []
      }
      return fallback.data ?? []
    }

    return Array.from(seen.values())
  } catch (error) {
    logSuppressedError("appointments", error)
    return []
  }
}

async function fetchAppointmentsByColumn(
  column: string,
  startISO: string,
  endISO: string,
  orderBy?: string
): Promise<any[] | null> {
  try {
    let query = supabase.from("appointments").select("*")

    if (column) {
      const normalized = column.toLowerCase()
      const treatAsDate = normalized.includes("date")
      if (treatAsDate) {
        const startDate = startISO.slice(0, 10)
        const endDate = endISO.slice(0, 10)
        query = query.gte(column, startDate).lte(column, endDate)
      } else {
        query = query.gte(column, startISO).lt(column, endISO)
      }
    }

    if (orderBy) {
      query = query.order(orderBy, { ascending: true })
    }

    const { data, error } = await query

    if (error) {
      if (isMissingColumnError(error)) {
        return null
      }
      if (isMissingRelationError(error) || isPermissionDeniedError(error)) {
        return []
      }
      logSuppressedError(`appointments:${column}`, error)
      return null
    }

    return data ?? []
  } catch (error: any) {
    if (isMissingColumnError(error)) {
      return null
    }
    if (isMissingRelationError(error) || isPermissionDeniedError(error)) {
      return []
    }
    logSuppressedError(`appointments:${column}`, error)
    return null
  }
}

export default function StaffWorkload() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [entries, setEntries] = useState<StaffSummary[]>([])

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const now = new Date()
        const dayStart = new Date(now)
        dayStart.setHours(0, 0, 0, 0)
        const dayEnd = new Date(now)
        dayEnd.setHours(23, 59, 59, 999)

        const startISO = dayStart.toISOString()
        const endISO = dayEnd.toISOString()

        const employeesPromise = supabase.from("employees").select("id, name, active").order("name")
        const shiftsPromise = supabase
          .from("staff_shifts")
          .select("employee_id, staff_id, starts_at, ends_at, start_time, end_time")
          .lte("starts_at", endISO)
          .gte("ends_at", startISO)
        const catalogPromise = supabase.from("service_catalog").select("id, name, default_minutes, category, type")
        const servicesPromise = supabase
          .from("services")
          .select("id, name, default_minutes, duration_minutes, minutes, category, type, service_type")

        const [appointmentsRaw, employeesRes, shiftsRes, catalogRes, servicesRes] = await Promise.all([
          fetchAppointmentsForDay(startISO, endISO),
          employeesPromise,
          shiftsPromise,
          catalogPromise,
          servicesPromise
        ])

        let employees: StaffRecord[] = []

        if (employeesRes.error) {
          if (!isPermissionDeniedError(employeesRes.error) && !isMissingRelationError(employeesRes.error)) {
            console.warn("Unable to fetch employees table for staff workload", employeesRes.error)
          }
        } else {
          employees = (employeesRes.data ?? [])
            .filter((row: any) => row && row.active !== false)
            .map((row: any) => ({
              id: String(row.id),
              name: typeof row.name === "string" && row.name.trim() ? row.name.trim() : `Staff #${row.id}`
            })) as StaffRecord[]
        }

        const serviceLookup = new Map<string, ServiceMeta>()

        if (catalogRes.error) {
          if (
            !isMissingRelationError(catalogRes.error) &&
            !isMissingColumnError(catalogRes.error) &&
            !isPermissionDeniedError(catalogRes.error)
          ) {
            logSuppressedError("service_catalog", catalogRes.error)
          }
        } else {
          for (const row of catalogRes.data ?? []) {
            if (!row) continue
            const id = row.id
            if (id === null || id === undefined) continue
            const key = String(id)
            serviceLookup.set(key, {
              id: key,
              name: typeof row.name === "string" ? row.name : null,
              minutes: toNumber(row.default_minutes),
              category: typeof row.category === "string" ? row.category : typeof row.type === "string" ? row.type : null
            })
          }
        }

        if (servicesRes.error) {
          if (
            !isMissingRelationError(servicesRes.error) &&
            !isMissingColumnError(servicesRes.error) &&
            !isPermissionDeniedError(servicesRes.error)
          ) {
            logSuppressedError("services", servicesRes.error)
          }
        } else {
          for (const row of servicesRes.data ?? []) {
            if (!row) continue
            const id = row.id
            if (id === null || id === undefined) continue
            const key = String(id)
            const existing = serviceLookup.get(key)
            serviceLookup.set(key, {
              id: key,
              name: typeof row.name === "string" ? row.name : existing?.name ?? null,
              minutes: firstNumber(toNumber(row.duration_minutes), toNumber(row.default_minutes), toNumber(row.minutes), existing?.minutes) ?? null,
              category:
                typeof row.category === "string"
                  ? row.category
                  : typeof row.type === "string"
                  ? row.type
                  : typeof row.service_type === "string"
                  ? row.service_type
                  : existing?.category ?? null
            })
          }
        }

        let shiftDataAvailable = true
        const shiftMinutes = new Map<string, number>()
        if (shiftsRes.error) {
          if (
            isMissingRelationError(shiftsRes.error) ||
            isMissingColumnError(shiftsRes.error) ||
            isPermissionDeniedError(shiftsRes.error)
          ) {
            shiftDataAvailable = false
          } else {
            shiftDataAvailable = false
            logSuppressedError("staff_shifts", shiftsRes.error)
          }
        } else {
          for (const row of shiftsRes.data ?? []) {
            if (!row) continue
            const employeeId = extractEmployeeId(row)
            if (!employeeId) continue
            const start = parseDate(row.starts_at ?? row.start_time)
            const end = parseDate(row.ends_at ?? row.end_time)
            if (!start || !end) continue
            const overlapStart = start.getTime() < dayStart.getTime() ? dayStart : start
            const overlapEnd = end.getTime() > dayEnd.getTime() ? dayEnd : end
            const minutes = minutesBetween(overlapStart, overlapEnd)
            if (minutes <= 0) continue
            const current = shiftMinutes.get(employeeId) ?? 0
            shiftMinutes.set(employeeId, current + minutes)
          }
        }

        const appointments = normalizeAppointments(appointmentsRaw, serviceLookup)

        const staffFromAppointments = buildStaffFallbackFromAppointments(appointments)

        if (employees.length === 0) {
          employees = staffFromAppointments
        } else {
          for (const staff of staffFromAppointments) {
            if (!employees.some((existing) => existing.id === staff.id)) {
              employees.push(staff)
            }
          }
        }

        const appointmentsByEmployee = new Map<string, AppointmentRow[]>()
        for (const appt of appointments) {
          if (!appt.assigneeId) continue
          const list = appointmentsByEmployee.get(appt.assigneeId)
          if (list) {
            list.push(appt)
          } else {
            appointmentsByEmployee.set(appt.assigneeId, [appt])
          }
        }

        const summaries = employees.map((staff) => {
          const staffAppointments = appointmentsByEmployee.get(staff.id) ?? []
          return buildSummary(staff, staffAppointments, shiftMinutes.get(staff.id) ?? null, shiftDataAvailable, now)
        })

        summaries.sort((a, b) => {
          if (b.remainingMinutes !== a.remainingMinutes) return b.remainingMinutes - a.remainingMinutes
          if (b.dogsTotal !== a.dogsTotal) return b.dogsTotal - a.dogsTotal
          return a.name.localeCompare(b.name)
        })

        if (!active) return
        setEntries(summaries)
      } catch (cause: any) {
        console.error("Failed to load staff workload", cause)
        if (!active) return
        setError("Unable to load staff workload")
        setEntries([])
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [])

  if (loading) {
    return <div className="text-white/85">Loading staff workload…</div>
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-200/60 bg-rose-500/20 p-4 text-sm text-rose-100 backdrop-blur">
        {error}
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-3xl border border-white/30 bg-white/10 p-6 text-white/80 backdrop-blur">
        No groomers scheduled today.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <StaffCard key={entry.id} summary={entry} />
      ))}
    </div>
  )
}

type StaffCardProps = {
  summary: StaffSummary
}

function StaffCard({ summary }: StaffCardProps) {
  const progress = summary.dogsTotal > 0 ? summary.dogsCompleted / summary.dogsTotal : 0
  const estimatedLabel = formatMinutes(summary.estimatedMinutes)
  const actualLabel = formatMinutes(summary.actualMinutes)
  const avgLabel = formatAverageLabel(summary.avgDiff)
  const remainingLabel = formatRemainingLabel(summary.remainingDogs, summary.remainingMinutes)
  const utilizationPercent = summary.utilization !== null ? Math.round(summary.utilization * 100) : null
  const utilizationTone =
    summary.utilizationStatus === "high"
      ? "text-rose-100"
      : summary.utilizationStatus === "low"
      ? "text-amber-100"
      : summary.utilizationStatus === "ideal"
      ? "text-emerald-100"
      : "text-white/70"

  const utilizationLabel = (() => {
    if (utilizationPercent === null) {
      return summary.shiftDataAvailable ? "No shift scheduled" : "No shift data"
    }
    return `${utilizationPercent}% booked`
  })()

  const utilizationHint = (() => {
    if (utilizationPercent === null) {
      return summary.shiftDataAvailable ? "Assign shift to track load" : ""
    }
    if (summary.utilizationStatus === "high") return "Over capacity"
    if (summary.utilizationStatus === "low") return "Light day"
    if (summary.utilizationStatus === "ideal") return "On track"
    return ""
  })()

  return (
    <article className="rounded-3xl border border-white/20 bg-white/10 p-5 text-white shadow-inner backdrop-blur">
      <header className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-tight drop-shadow-sm">{summary.name}</h3>
          <p className="mt-1 text-[0.65rem] uppercase tracking-[0.3em] text-white/60">Dogs today</p>
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-3xl font-bold text-brand-navy shadow-lg shadow-black/10">
          {summary.dogsTotal}
        </div>
      </header>

      <section className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-2xl bg-white/5 p-3">
          <div className="text-[0.65rem] uppercase tracking-wider text-white/60">Estimated time</div>
          <div className="mt-1 text-sm font-semibold">{estimatedLabel}</div>
        </div>
        <div className="rounded-2xl bg-white/5 p-3">
          <div className="text-[0.65rem] uppercase tracking-wider text-white/60">Actual time</div>
          <div className="mt-1 text-sm font-semibold">{actualLabel}</div>
        </div>
      </section>

      <section className="mt-4">
        <div className="flex items-center justify-between text-[0.65rem] uppercase tracking-wider text-white/60">
          <span>Progress</span>
          <span>
            {summary.dogsCompleted}/{summary.dogsTotal} dogs
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-gradient-to-r from-rose-400 via-amber-300 to-emerald-400 transition-all"
            style={{ width: `${Math.min(Math.max(progress, 0), 1) * 100}%` }}
          />
        </div>
      </section>

      <section className="mt-4">
        <div className="flex items-center justify-between text-[0.65rem] uppercase tracking-wider text-white/60">
          <span>Avg vs estimate</span>
          <span className={clsx("text-xs font-semibold", summary.avgDiff !== null && summary.avgDiff < -1 && "text-emerald-100", summary.avgDiff !== null && summary.avgDiff > 1 && "text-rose-100")}>{avgLabel}</span>
        </div>
        <AverageDeltaBar value={summary.avgDiff} />
      </section>

      <section className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-2xl bg-white/5 p-3">
          <div className="text-[0.65rem] uppercase tracking-wider text-white/60">Utilization</div>
          <div className={clsx("mt-1 text-sm font-semibold", utilizationTone)}>{utilizationLabel}</div>
          {utilizationHint && <p className="mt-1 text-[0.6rem] uppercase tracking-widest text-white/50">{utilizationHint}</p>}
        </div>
        <div className="rounded-2xl bg-white/5 p-3">
          <div className="text-[0.65rem] uppercase tracking-wider text-white/60">Remaining load</div>
          <div className="mt-1 text-sm font-semibold">{remainingLabel}</div>
        </div>
      </section>

      <section className="mt-4">
        <div className="flex items-center justify-between text-[0.65rem] uppercase tracking-wider text-white/60">
          <span>Task mix</span>
        </div>
        <TaskMixBar mix={summary.taskMix} />
      </section>
    </article>
  )
}

type AverageDeltaBarProps = {
  value: number | null
}

function AverageDeltaBar({ value }: AverageDeltaBarProps) {
  if (value === null) {
    return <div className="mt-2 h-2 w-full rounded-full bg-white/10" />
  }
  const clamped = Math.max(Math.min(value, 100), -100)
  const left = clamped < 0 ? Math.min(Math.abs(clamped), 100) : 0
  const right = clamped > 0 ? Math.min(clamped, 100) : 0

  return (
    <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-white/10">
      <div className="relative flex-1">
        <div className="absolute inset-y-0 right-0 w-px bg-white/25" />
        {left > 0 && (
          <div
            className="absolute inset-y-0 right-0 rounded-r-full bg-emerald-400/80"
            style={{ width: `${left}%` }}
          />
        )}
      </div>
      <div className="relative flex-1">
        {right > 0 && (
          <div
            className="absolute inset-y-0 left-0 rounded-l-full bg-rose-400/80"
            style={{ width: `${right}%` }}
          />
        )}
      </div>
    </div>
  )
}

type TaskMixBarProps = {
  mix: TaskMix
}

function TaskMixBar({ mix }: TaskMixBarProps) {
  const total = mix.baths + mix.grooms + mix.addons + mix.other

  if (total === 0) {
    return <div className="mt-2 h-2 w-full rounded-full bg-white/10" />
  }

  return (
    <div className="mt-2 space-y-2">
      <div className="flex h-2 overflow-hidden rounded-full bg-white/10">
        {(Object.keys(mix) as TaskCategory[]).map((key) => {
          const count = mix[key]
          if (!count) return null
          const width = (count / total) * 100
          return <div key={key} className={clsx("h-full", mixColors[key])} style={{ width: `${width}%` }} />
        })}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[0.65rem] text-white/75">
        {(Object.keys(mix) as TaskCategory[]).map((key) => {
          const count = mix[key]
          if (!count) return null
          const percent = Math.round((count / total) * 100)
          return (
            <div key={key} className="flex items-center gap-1">
              <span className={clsx("h-2 w-2 rounded-full", mixColors[key])} />
              <span>
                {mixLabels[key]} {percent}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function buildSummary(
  staff: StaffRecord,
  appointments: AppointmentRow[],
  shiftMinutes: number | null,
  shiftDataAvailable: boolean,
  now: Date
): StaffSummary {
  let dogsTotal = 0
  let dogsCompleted = 0
  let estimatedMinutes = 0
  let actualMinutes = 0
  let estimatedCompleted = 0
  let actualCompleted = 0
  let remainingDogs = 0
  let remainingMinutes = 0
  const mix: TaskMix = { baths: 0, grooms: 0, addons: 0, other: 0 }

  for (const appt of appointments) {
    const kind = getStatusKind(appt.status)
    if (kind === "cancelled") continue

    dogsTotal += 1
    estimatedMinutes += appt.estimatedMinutes
    mix[appt.serviceCategory] += 1

    const start = appt.startTime
    const end = appt.endTime

    let actualForAppointment = appt.actualMinutes ?? 0

    if (kind === "completed") {
      if (actualForAppointment <= 0 && start) {
        const effectiveEnd = end ?? null
        if (effectiveEnd) {
          actualForAppointment = minutesBetween(start, effectiveEnd)
        }
      }
      if (actualForAppointment <= 0) {
        actualForAppointment = appt.estimatedMinutes
      }
      dogsCompleted += 1
      estimatedCompleted += appt.estimatedMinutes
      actualCompleted += actualForAppointment
    } else {
      if (kind === "progress" && actualForAppointment <= 0 && start) {
        const elapsed = minutesBetween(start, now)
        actualForAppointment = Math.min(elapsed, appt.estimatedMinutes)
      }
      const remaining = Math.max(appt.estimatedMinutes - actualForAppointment, 0)
      remainingDogs += 1
      remainingMinutes += remaining
    }

    actualMinutes += Math.max(actualForAppointment, 0)
  }

  const avgDiff = estimatedCompleted > 0 ? ((actualCompleted - estimatedCompleted) / estimatedCompleted) * 100 : null
  const shift = shiftMinutes !== null && shiftMinutes > 0 ? shiftMinutes : null
  const utilization = shift ? estimatedMinutes / shift : null
  const utilizationStatus: StaffSummary["utilizationStatus"] = utilization === null
    ? "none"
    : utilization > 1.1
    ? "high"
    : utilization < 0.6
    ? "low"
    : "ideal"

  return {
    id: staff.id,
    name: staff.name,
    dogsTotal,
    dogsCompleted,
    estimatedMinutes,
    actualMinutes,
    avgDiff,
    utilization,
    utilizationStatus,
    taskMix: mix,
    remainingDogs,
    remainingMinutes,
    shiftMinutes: shift,
    shiftDataAvailable
  }
}

function normalizeAppointments(rows: any[], serviceLookup: Map<string, ServiceMeta>): AppointmentRow[] {
  const items: AppointmentRow[] = []
  const seen = new Set<string>()

  for (const row of rows ?? []) {
    if (!row) continue
    const id = row.id
    if (id === null || id === undefined) continue
    const key = String(id)
    if (seen.has(key)) continue
    seen.add(key)

    const employeeId = row.employee_id !== null && row.employee_id !== undefined ? String(row.employee_id) : null
    const assigneeName = deriveAssigneeName(row, employeeId)
    const assigneeId = createAssigneeId(employeeId, assigneeName)
    const status = typeof row.status === "string" ? row.status : ""

    const start = parseDate(row.start_time) ?? parseDate(row.scheduled_time)
    const end = parseDate(row.completed_at) ?? parseDate(row.end_time)

    const serviceFromRelation = parseService(row.services)
    const serviceId = serviceFromRelation?.id ?? (row.service_id !== null && row.service_id !== undefined ? String(row.service_id) : null)
    const fallbackService = serviceId ? serviceLookup.get(serviceId) : undefined

    const meta = resolveServiceMeta(serviceFromRelation, fallbackService, row)

    if (serviceId) {
      const existing = serviceLookup.get(serviceId)
      serviceLookup.set(serviceId, {
        id: serviceId,
        name: meta.name ?? existing?.name ?? null,
        minutes: firstNumber(meta.minutes, existing?.minutes) ?? null,
        category: serviceFromRelation?.category ?? existing?.category ?? meta.rawCategory ?? null
      })
    }

    const actualMinutesValue = firstNumber(
      toNumber(row.actual_minutes),
      toNumber(row.actual_duration_minutes),
      toNumber(row.actual_time_minutes),
      toNumber(row.time_worked_minutes),
      toNumber(row.time_worked),
      toNumber(row.minutes_worked),
      toNumber(row.duration_worked),
      toNumber(row.work_minutes),
      toNumber(row.total_time_minutes),
      toNumber(row.total_duration_minutes),
      toNumber(row.total_work_minutes),
      toNumber(row.total_minutes_worked)
    )
    const actualMinutes = actualMinutesValue !== null ? Math.max(actualMinutesValue, 0) : null

    items.push({
      id: key,
      employeeId,
      assigneeId,
      assigneeName,
      status,
      startTime: start,
      endTime: end,
      estimatedMinutes: meta.minutes ?? 60,
      actualMinutes,
      serviceCategory: meta.category,
      serviceName: meta.name
    })
  }

  return items
}

function deriveAssigneeName(row: any, employeeId: string | null) {
  const candidates = [
    row?.employee_name,
    row?.groomer_name,
    row?.staff_name,
    row?.worker_name,
    row?.assignee_name,
    row?.assignee,
    row?.assigned_staff,
    row?.assigned_to,
    row?.assigned_employee,
    row?.assigned_employee_name,
    row?.staff_full_name,
    row?.staff_display_name,
    row?.staff_member_name,
    row?.staff_member,
    row?.team_member_name,
    row?.team_member,
    row?.provider_name,
    row?.provider,
    row?.resource_name,
    row?.resource,
    row?.employee_full_name,
    row?.employee_display_name,
    row?.primary_staff_name,
    row?.primary_groomer_name,
    row?.primary_employee_name,
    row?.assigned_groomer,
    row?.assigned_groomer_name,
    row?.assigned_team_member,
    row?.assigned_team_member_name,
    row?.assigned_worker,
    row?.assigned_worker_name,
    row?.lead_groomer_name,
    row?.lead_staff_name,
    row?.staff,
    row?.employee,
    row?.groomer,
    row?.worker,
    row?.staff_member_full_name,
    row?.team_member_full_name,
    row?.employee_profile,
    row?.staff_profile,
    row?.assignee_profile,
    row?.provider_profile,
    row?.resource_profile,
    row?.team_member_profile,
    row?.worker_profile,
    row?.employee_details,
    row?.staff_details,
    row?.team_member_details,
    row?.staff_member_details,
    row?.resource_details,
    row?.assigned_staff_profile,
    row?.assigned_profile,
    row?.profile
  ]

  for (const value of candidates) {
    const name = normalizeNameCandidate(value)
    if (name) return name
  }

  return employeeId ? `Staff #${employeeId}` : "Unassigned"
}

function normalizeNameCandidate(value: any): string | null {
  if (!value) return null
  if (typeof value === "string") return normalizeName(value)

  if (Array.isArray(value)) {
    for (const entry of value) {
      const name = normalizeNameCandidate(entry)
      if (name) return name
    }
    return null
  }

  if (typeof value === "object") {
    const direct =
      normalizeName((value as any)?.name) ??
      normalizeName((value as any)?.full_name) ??
      normalizeName((value as any)?.display_name) ??
      normalizeName((value as any)?.title)
    if (direct) return direct

    const first = normalizeName((value as any)?.first_name)
    const last = normalizeName((value as any)?.last_name)
    const parts = [first, last].filter((part): part is string => Boolean(part))
    if (parts.length > 0) {
      return parts.join(" ")
    }

    const nestedKeys = ["profile", "user", "employee", "staff", "member", "groomer", "assignee", "provider", "resource"]
    for (const key of nestedKeys) {
      const nested = normalizeNameCandidate((value as any)?.[key])
      if (nested) return nested
    }
  }

  return null
}

function buildStaffFallbackFromAppointments(appointments: AppointmentRow[]): StaffRecord[] {
  const byId = new Map<string, StaffRecord>()

  for (const appt of appointments) {
    if (!appt.assigneeId) continue
    if (byId.has(appt.assigneeId)) continue
    byId.set(appt.assigneeId, {
      id: appt.assigneeId,
      name: appt.assigneeName || (appt.employeeId ? `Staff #${appt.employeeId}` : "Unassigned")
    })
  }

  return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name))
}

type ServiceMetaWithCategory = {
  name: string | null
  minutes: number | null
  rawCategory: string | null
  category: TaskCategory
}

function resolveServiceMeta(
  service: ServiceMeta | null,
  fallback: ServiceMeta | undefined,
  row: any
): ServiceMetaWithCategory {
  const name = service?.name ?? fallback?.name ?? (typeof row.service_name === "string" ? row.service_name : null)
  const minutes =
    firstNumber(
      service?.minutes,
      fallback?.minutes,
      toNumber(row.estimated_minutes),
      toNumber(row.service_minutes),
      toNumber(row.duration_minutes),
      toNumber(row.default_minutes),
      toNumber(row.total_duration),
      toNumber(row.estimated_duration),
      toNumber(row.expected_duration),
      toNumber(row.estimate_minutes),
      toNumber(row.estimated_time_minutes),
      toNumber(row.time_estimate_minutes),
      toNumber(row.planned_minutes),
      toNumber(row.duration),
      toNumber(row.duration_mins),
      toNumber(row.duration_minutes_total),
      toNumber(row.service_duration_minutes),
      toNumber(row.service_duration),
      toNumber(row.total_estimated_minutes)
    ) ?? 60

  const rawCategory =
    service?.category ??
    fallback?.category ??
    (typeof row.service_category === "string" ? row.service_category : null) ??
    (typeof row.type === "string" ? row.type : null) ??
    (typeof row.service_type === "string" ? row.service_type : null) ??
    (typeof row.category === "string" ? row.category : null) ??
    (typeof row.service_kind === "string" ? row.service_kind : null) ??
    (typeof row.service_group === "string" ? row.service_group : null)

  const category = toTaskCategory(rawCategory, name)

  return { name, minutes, rawCategory, category }
}

function parseService(input: any): ServiceMeta | null {
  if (!input) return null
  const record = Array.isArray(input) ? input[0] ?? null : input
  if (!record) return null
  const id = record.id !== null && record.id !== undefined ? String(record.id) : null
  if (!id) {
    return {
      id: "",
      name: typeof record.name === "string" ? record.name : null,
      minutes: firstNumber(
        toNumber(record.default_minutes),
        toNumber(record.duration_minutes),
        toNumber(record.minutes),
        toNumber(record.estimated_minutes),
        toNumber(record.total_duration),
        toNumber(record.duration)
      ),
      category:
        typeof record.category === "string"
          ? record.category
          : typeof record.type === "string"
          ? record.type
          : typeof record.service_type === "string"
          ? record.service_type
          : typeof record.service_kind === "string"
          ? record.service_kind
          : null
    }
  }
  return {
    id,
    name: typeof record.name === "string" ? record.name : null,
    minutes: firstNumber(
      toNumber(record.default_minutes),
      toNumber(record.duration_minutes),
      toNumber(record.minutes),
      toNumber(record.estimated_minutes),
      toNumber(record.total_duration),
      toNumber(record.duration)
    ),
    category:
      typeof record.category === "string"
        ? record.category
        : typeof record.type === "string"
        ? record.type
        : typeof record.service_type === "string"
        ? record.service_type
        : typeof record.service_kind === "string"
        ? record.service_kind
        : null
  }
}

function getStatusKind(status: string): "completed" | "progress" | "scheduled" | "cancelled" {
  const key = status?.toLowerCase().replace(/\s+/g, "_") ?? ""
  return statusMap[key] ?? "scheduled"
}

function toTaskCategory(raw: string | null | undefined, name: string | null | undefined): TaskCategory {
  const value = raw?.toLowerCase() ?? ""
  if (value.includes("bath") || value.includes("wash")) return "baths"
  if (value.includes("groom")) return "grooms"
  if (value.includes("addon") || value.includes("add-on") || value.includes("add on") || value.includes("nail") || value.includes("teeth") || value.includes("upgrade") || value.includes("spa") || value.includes("trim")) {
    return "addons"
  }

  const label = name?.toLowerCase() ?? ""
  if (label.includes("bath") || label.includes("wash")) return "baths"
  if (label.includes("groom")) return "grooms"
  if (
    label.includes("addon") ||
    label.includes("add-on") ||
    label.includes("add on") ||
    label.includes("nail") ||
    label.includes("teeth") ||
    label.includes("upgrade") ||
    label.includes("spa") ||
    label.includes("trim") ||
    label.includes("paw")
  ) {
    return "addons"
  }
  return "other"
}

function formatMinutes(totalMinutes: number) {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return "0 min"
  const minutes = Math.round(totalMinutes)
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  const parts: string[] = []
  if (hours > 0) parts.push(`${hours}h`)
  if (mins > 0) parts.push(`${mins}m`)
  if (parts.length === 0) return "<1m"
  return parts.join(" ")
}

function formatAverageLabel(diff: number | null) {
  if (diff === null) return "No completed jobs"
  const abs = Math.abs(diff)
  if (abs < 1) return "On pace"
  const rounded = Math.round(abs)
  return diff < 0 ? `${rounded}% faster` : `${rounded}% slower`
}

function formatRemainingLabel(dogs: number, minutes: number) {
  if (dogs <= 0) return "All caught up"
  const dogLabel = dogs === 1 ? "1 dog" : `${dogs} dogs`
  return `${dogLabel} · ${formatMinutes(minutes)} left`
}

function createAssigneeId(employeeId: string | null, name: string) {
  if (employeeId) return employeeId
  const base = slugifyName(name)
  return base ? `name:${base}` : "unassigned"
}

function normalizeName(value: any): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function slugifyName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function minutesBetween(start: Date, end: Date) {
  const diff = (end.getTime() - start.getTime()) / 60000
  return diff > 0 ? diff : 0
}

function parseDate(value: any): Date | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function toNumber(value: any): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null
  }
  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function firstNumber(...values: Array<number | null | undefined>) {
  for (const value of values) {
    if (value === null || value === undefined) continue
    if (Number.isFinite(value)) return value
  }
  return null
}

function extractEmployeeId(row: any) {
  const id = row?.employee_id ?? row?.staff_id ?? row?.groomer_id ?? row?.worker_id
  if (id === null || id === undefined) return null
  return String(id)
}

function logSuppressedError(context: string, error: any) {
  if (!error) return
  console.warn(`[StaffWorkload] Suppressed error while loading ${context}`, error)
}

function isPermissionDeniedError(error: any) {
  if (!error) return false
  const code = typeof error.code === "string" ? error.code : ""
  if (code === "42501" || code === "PGRST301") return true
  const message = typeof error.message === "string" ? error.message.toLowerCase() : ""
  return (
    message.includes("permission denied") ||
    message.includes("not authorized") ||
    message.includes("no access") ||
    message.includes("row level security") ||
    message.includes("rls")
  )
}

function isMissingColumnError(error: any) {
  if (!error) return false
  const code = typeof error.code === "string" ? error.code : ""
  if (code === "42703") return true
  const message = typeof error.message === "string" ? error.message.toLowerCase() : ""
  return message.includes("column") && message.includes("does not exist")
}

function isMissingRelationError(error: any) {
  if (!error) return false
  const code = typeof error.code === "string" ? error.code : ""
  if (code === "42P01") return true
  const message = typeof error.message === "string" ? error.message.toLowerCase() : ""
  return message.includes("relation") && message.includes("does not exist")
}
