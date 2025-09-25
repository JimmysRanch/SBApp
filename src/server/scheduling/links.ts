import { randomBytes } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '../../../lib/supabase/server';
import { applyRescheduleSchema, rescheduleLinkSchema, type ApplyRescheduleInput, type RescheduleLinkInput } from './schemas';
import { listSlots, type AvailableSlot } from './slots';
import type {
  AppointmentRow,
  AppointmentWithServiceRow,
  RescheduleLinkRow,
  ServiceRow,
} from './types';
import { MINUTE, addMinutes, toDate } from './utils';

const DEFAULT_TTL_HOURS = 48;

function resolveBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL;
  if (envUrl) return envUrl.endsWith('/') ? envUrl : `${envUrl}/`;
  const vercel = process.env.VERCEL_URL;
  if (vercel) {
    const normalized = vercel.startsWith('http') ? vercel : `https://${vercel}`;
    return normalized.endsWith('/') ? normalized : `${normalized}/`;
  }
  return 'http://localhost:3000/';
}

function buildRescheduleUrl(token: string): string {
  const base = resolveBaseUrl();
  const url = new URL(`book/reschedule/${token}`, base);
  return url.toString();
}

function generateToken(): string {
  return randomBytes(24).toString('base64url');
}

async function loadRescheduleLink(supabase: SupabaseClient, token: string) {
  const { data, error } = await supabase
    .from('reschedule_links')
    .select('id, appointment_id, token, expires_at, used_at')
    .eq('token', token)
    .maybeSingle();
  if (error) throw error;
  const link = data as RescheduleLinkRow | null;
  if (!link) throw new Error('Reschedule token not found');
  return link;
}

async function loadAppointmentWithService(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase
    .from('appointments')
    .select('*, services:service_id (id, base_price, duration_min, buffer_pre_min, buffer_post_min)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  const record = data as AppointmentWithServiceRow | null;
  if (!record) throw new Error('Appointment not found for reschedule');
  const { services, ...appointment } = record;
  return { appointment: appointment as AppointmentRow, service: services ?? null };
}

export async function createRescheduleLink(rawInput: RescheduleLinkInput) {
  const input = rescheduleLinkSchema.parse(rawInput);
  const supabase = getSupabaseAdmin();

  const ttlHours = input.ttlHours ?? DEFAULT_TTL_HOURS;
  const expiresAt = new Date(Date.now() + ttlHours * 60 * MINUTE);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const token = generateToken();
    const { data, error } = await supabase
      .from('reschedule_links')
      .insert({
        appointment_id: input.appointmentId,
        token,
        expires_at: expiresAt.toISOString(),
      })
      .select('id')
      .maybeSingle();
    if (error && error.code === '23505') {
      continue;
    }
    if (error) throw error;
    if (data) {
      return {
        token,
        url: buildRescheduleUrl(token),
        expiresAt,
      };
    }
  }

  throw new Error('Unable to allocate reschedule token');
}

type ApplyRescheduleDependencies = {
  getSupabaseAdmin?: () => SupabaseClient;
  listSlots?: (input: Parameters<typeof listSlots>[0]) => Promise<AvailableSlot[]>;
  now?: () => Date;
};

export async function applyReschedule(
  rawInput: ApplyRescheduleInput,
  dependencies: ApplyRescheduleDependencies = {},
) {
  const input = applyRescheduleSchema.parse(rawInput);
  const getAdmin = dependencies.getSupabaseAdmin ?? getSupabaseAdmin;
  const listAvailableSlots = dependencies.listSlots ?? listSlots;
  const now = dependencies.now ?? (() => new Date());

  const supabase = getAdmin();
  const link = await loadRescheduleLink(supabase, input.token);
  if (link.used_at) {
    throw new Error('Reschedule link has already been used.');
  }
  const currentTime = now();
  if (link.expires_at && new Date(link.expires_at) < currentTime) {
    throw new Error('Reschedule link has expired.');
  }

  const { appointment, service } = await loadAppointmentWithService(supabase, link.appointment_id);
  const startsAt = input.newSlot.startsAt;
  const serviceId = input.newSlot.serviceId;
  if (appointment.service_id && appointment.service_id !== serviceId) {
    throw new Error('Service mismatch for reschedule.');
  }

  const staffId = input.newSlot.staffId ?? appointment.staff_id ?? undefined;
  const validationSlots = await listAvailableSlots({
    staffId,
    serviceId,
    from: addMinutes(startsAt, -180),
    to: addMinutes(startsAt, 180),
  });
  const isAvailable = validationSlots.some(
    (slot) => slot.staffId === staffId && slot.start.getTime() === startsAt.getTime(),
  );
  if (!isAvailable) {
    throw new Error('Requested slot is not available.');
  }

  const originalDuration = Math.max(
    Math.round((toDate(appointment.ends_at).getTime() - toDate(appointment.starts_at).getTime()) / MINUTE),
    service?.duration_min ?? 0,
  );
  const effectiveDuration = originalDuration > 0 ? originalDuration : service?.duration_min ?? 60;
  const newEnd = addMinutes(startsAt, effectiveDuration);

  const { data: updated, error: updateError } = await supabase
    .from('appointments')
    .update({
      starts_at: startsAt.toISOString(),
      ends_at: newEnd.toISOString(),
      staff_id: staffId ?? null,
    })
    .eq('id', appointment.id)
    .select('*')
    .maybeSingle();
  if (updateError) throw updateError;

  const { error: markUsedError } = await supabase
    .from('reschedule_links')
    .update({ used_at: currentTime.toISOString() })
    .eq('id', link.id);
  if (markUsedError) throw markUsedError;

  await supabase.from('audit_log').insert({
    actor_id: appointment.created_by,
    action: 'appointment_rescheduled',
    entity: 'appointments',
    entity_id: appointment.id,
  });

  return updated ?? appointment;
}
