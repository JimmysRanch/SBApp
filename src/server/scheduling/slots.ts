import { rrulestr, type RRuleSet } from 'rrule';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import type { SlotQueryInput } from './schemas';
import { slotQuerySchema } from './schemas';
import type { AppointmentRow, AvailabilityRuleRow, BlackoutRow, ServiceRow } from './types';
import { MINUTE, addMinutes, toDate } from './utils';
const ACTIVE_APPOINTMENT_STATUSES = new Set([
  'booked',
  'checked_in',
  'in_progress',
  'completed',
]);

export interface AvailableSlot {
  staffId: string;
  start: Date;
  end: Date;
}

type Interval = { start: Date; end: Date };

function roundUpToInterval(date: Date, intervalMinutes: number): Date {
  const ms = intervalMinutes * MINUTE;
  return new Date(Math.ceil(date.getTime() / ms) * ms);
}

function parseICalDate(raw: string | undefined | null): Date | null {
  if (!raw) return null;
  const [, value] = raw.split(':', 2);
  const actual = value ?? raw;
  if (actual.endsWith('Z')) return new Date(actual);
  const match = actual.match(/^(\d{4})(\d{2})(\d{2})T?(\d{2})(\d{2})(\d{2})?$/);
  if (match) {
    const [, y, m, d, hh, mm, ss] = match;
    const iso = `${y}-${m}-${d}T${hh}:${mm}:${ss ?? '00'}`;
    return new Date(iso);
  }
  return new Date(actual);
}

function parseISODurationMinutes(input: string): number | null {
  const match = input.match(/P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?/);
  if (!match) return null;
  const [, days, hours, minutes, seconds] = match;
  const total =
    (days ? Number.parseInt(days, 10) * 24 * 60 : 0) +
    (hours ? Number.parseInt(hours, 10) * 60 : 0) +
    (minutes ? Number.parseInt(minutes, 10) : 0) +
    (seconds ? Math.ceil(Number.parseInt(seconds, 10) / 60) : 0);
  return Number.isFinite(total) && total > 0 ? total : null;
}

function extractDurationMinutes(rruleText: string): number | null {
  const custom = rruleText.match(/X-[A-Z-]*DURATION-MINUTES:(\d+)/i);
  if (custom) return Number.parseInt(custom[1], 10);
  const durationLine = rruleText.match(/DURATION:([^\n]+)/i);
  if (durationLine) {
    const duration = parseISODurationMinutes(durationLine[1].trim());
    if (duration) return duration;
  }
  const dtStartLine = rruleText.match(/DTSTART[^:]*:([^\n]+)/i);
  const dtEndLine = rruleText.match(/DTEND[^:]*:([^\n]+)/i);
  if (dtStartLine && dtEndLine) {
    const start = parseICalDate(dtStartLine[0].split(':')[1]);
    const end = parseICalDate(dtEndLine[0].split(':')[1]);
    if (start && end) {
      const diffMin = Math.floor((end.getTime() - start.getTime()) / MINUTE);
      if (diffMin > 0) return diffMin;
    }
  }
  return null;
}

function ensurePositiveDuration(durationMin: number | null | undefined, fallback: number): number {
  return durationMin && durationMin > 0 ? durationMin : fallback;
}

function intervalsOverlap(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end;
}

function normaliseIntervals(intervals: Interval[]): Interval[] {
  const sorted = intervals
    .map((interval) => ({ start: new Date(interval.start), end: new Date(interval.end) }))
    .filter((interval) => interval.end > interval.start)
    .sort((a, b) => a.start.getTime() - b.start.getTime());
  const merged: Interval[] = [];
  for (const interval of sorted) {
    const last = merged[merged.length - 1];
    if (!last || interval.start.getTime() > last.end.getTime()) {
      merged.push(interval);
    } else {
      last.end = new Date(Math.max(last.end.getTime(), interval.end.getTime()));
    }
  }
  return merged;
}

function expandAvailability(
  rule: AvailabilityRuleRow,
  windowStart: Date,
  windowEnd: Date,
  defaultDuration: number,
): Interval[] {
  const durationMin = ensurePositiveDuration(extractDurationMinutes(rule.rrule_text), defaultDuration);
  let schedule: RRuleSet;
  try {
    schedule = rrulestr(rule.rrule_text, { forceset: true }) as RRuleSet;
  } catch (error) {
    console.warn('Failed to parse availability rule', rule.id, error);
    return [];
  }
  const lookBehindMs = durationMin * MINUTE;
  const occurrences = schedule.between(new Date(windowStart.getTime() - lookBehindMs), windowEnd, true);
  return occurrences.map((start) => ({
    start,
    end: addMinutes(start, durationMin),
  }));
}

function buildBusyIntervals(
  appointments: AppointmentRow[],
  blackouts: BlackoutRow[],
  serviceBuffers: { pre: number; post: number },
): Map<string, Interval[]> {
  const map = new Map<string, Interval[]>();
  const extend = (staffId: string, interval: Interval) => {
    if (!map.has(staffId)) map.set(staffId, []);
    map.get(staffId)!.push(interval);
  };
  for (const blackout of blackouts) {
    extend(blackout.staff_id, {
      start: toDate(blackout.starts_at),
      end: toDate(blackout.ends_at),
    });
  }
  for (const appt of appointments) {
    if (!appt.staff_id) continue;
    if (!appt.status || !ACTIVE_APPOINTMENT_STATUSES.has(appt.status)) continue;
    const start = addMinutes(toDate(appt.starts_at), -serviceBuffers.pre);
    const end = addMinutes(toDate(appt.ends_at), serviceBuffers.post);
    extend(appt.staff_id, { start, end });
  }
  for (const [staffId, intervals] of map) {
    map.set(staffId, normaliseIntervals(intervals));
  }
  return map;
}

function slotOverlapsBusy(slot: Interval, busy: Interval[]): boolean {
  for (const interval of busy) {
    if (intervalsOverlap(slot, interval)) return true;
  }
  return false;
}

export async function listSlots(rawInput: SlotQueryInput): Promise<AvailableSlot[]> {
  const input = slotQuerySchema.parse(rawInput);
  const { staffId, serviceId, from, to } = input;
  if (from >= to) return [];

  const supabase = getSupabaseAdmin();
  const [{ data: serviceRecord, error: serviceError }] = await Promise.all([
    supabase
      .from('services')
      .select('id, base_price, duration_min, buffer_pre_min, buffer_post_min')
      .eq('id', serviceId)
      .maybeSingle(),
  ]);

  if (serviceError) throw serviceError;
  const service = serviceRecord as ServiceRow | null;
  if (!service) return [];

  const serviceDuration = ensurePositiveDuration(service.duration_min, 60);
  const serviceBuffers = {
    pre: service.buffer_pre_min ?? 0,
    post: service.buffer_post_min ?? 0,
  };

  const availabilityQuery = supabase
    .from('availability_rules')
    .select('id, staff_id, rrule_text, tz, buffer_pre_min, buffer_post_min');
  if (staffId) availabilityQuery.eq('staff_id', staffId);
  const blackoutQuery = supabase
    .from('blackout_dates')
    .select('staff_id, starts_at, ends_at')
    .lte('starts_at', to.toISOString())
    .gte('ends_at', from.toISOString());
  if (staffId) blackoutQuery.eq('staff_id', staffId);
  const appointmentsQuery = supabase
    .from('appointments')
    .select('id, staff_id, starts_at, ends_at, status')
    .lte('starts_at', to.toISOString())
    .gte('ends_at', from.toISOString());
  if (staffId) appointmentsQuery.eq('staff_id', staffId);

  const [{ data: availabilityRules, error: availabilityError }, { data: blackoutDates, error: blackoutError }, { data: appointments, error: appointmentsError }]
    = await Promise.all([availabilityQuery, blackoutQuery, appointmentsQuery]);

  if (availabilityError) throw availabilityError;
  if (blackoutError) throw blackoutError;
  if (appointmentsError) throw appointmentsError;

  if (!availabilityRules || availabilityRules.length === 0) return [];

  const busyMap = buildBusyIntervals(appointments ?? [], blackoutDates ?? [], serviceBuffers);
  const slots: AvailableSlot[] = [];

  for (const rule of availabilityRules) {
    const staff = rule.staff_id;
    const windowIntervals = expandAvailability(rule, from, to, Math.max(serviceDuration + serviceBuffers.pre + serviceBuffers.post, 60));
    const busyIntervals = busyMap.get(staff) ?? [];
    const rulePre = rule.buffer_pre_min ?? 0;
    const rulePost = rule.buffer_post_min ?? 0;

    for (const window of windowIntervals) {
      const earliestAllowed = addMinutes(window.start, rulePre);
      const latestAllowed = addMinutes(window.end, -rulePost);
      if (latestAllowed <= earliestAllowed) continue;

      let candidate = roundUpToInterval(new Date(Math.max(earliestAllowed.getTime(), from.getTime())), 15);
      while (candidate < to) {
        const slotStart = candidate;
        const slotEnd = addMinutes(slotStart, serviceDuration);
        const blockStart = addMinutes(slotStart, -serviceBuffers.pre);
        const blockEnd = addMinutes(slotEnd, serviceBuffers.post);
        if (blockStart < earliestAllowed || blockEnd > latestAllowed) {
          candidate = addMinutes(candidate, 15);
          continue;
        }
        if (slotEnd > to || slotStart < from) {
          candidate = addMinutes(candidate, 15);
          continue;
        }
        const slotInterval: Interval = { start: blockStart, end: blockEnd };
        if (!slotOverlapsBusy(slotInterval, busyIntervals)) {
          slots.push({ staffId: staff, start: slotStart, end: slotEnd });
        }
        candidate = addMinutes(candidate, 15);
      }
    }
  }

  return slots.sort((a, b) => a.start.getTime() - b.start.getTime());
}
