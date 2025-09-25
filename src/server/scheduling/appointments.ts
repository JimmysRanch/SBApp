import { getSupabaseAdmin } from '../../../lib/supabase/server';
import {
  cancelAppointmentSchema,
  createAppointmentSchema,
  listDaySchema,
  listWeekSchema,
  updateAppointmentSchema,
  type CancelAppointmentInput,
  type CreateAppointmentInput,
  type ListDayInput,
  type ListWeekInput,
  type UpdateAppointmentInput,
} from './schemas';
import { listSlots } from './slots';
import type { AppointmentRow, AddOnRow, ServiceRow } from './types';
import { MINUTE, addMinutes } from './utils';

function roundToDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function startOfNextDay(date: Date): Date {
  return new Date(roundToDay(date).getTime() + 24 * 60 * MINUTE);
}

function startOfNextWeek(date: Date): Date {
  return new Date(roundToDay(date).getTime() + 7 * 24 * 60 * MINUTE);
}

function toIso(date: Date): string {
  return date.toISOString();
}

async function fetchService(serviceId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('services')
    .select('id, base_price, duration_min, buffer_pre_min, buffer_post_min')
    .eq('id', serviceId)
    .maybeSingle();
  if (error) throw error;
  const service = data as ServiceRow | null;
  if (!service) throw new Error('Service not found');
  return service;
}

async function fetchAppointment(id: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  const appointment = data as AppointmentRow | null;
  if (!appointment) throw new Error('Appointment not found');
  return appointment;
}

function normalisePrice(value: number | string | null | undefined): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return 0;
}

export async function createAppointment(rawPayload: CreateAppointmentInput) {
  const payload = createAppointmentSchema.parse(rawPayload);
  const service = await fetchService(payload.serviceId);
  const supabase = getSupabaseAdmin();

  const durationMin = payload.durationMin ?? service.duration_min ?? 60;
  const startsAt = payload.startsAt;
  const endsAt = addMinutes(startsAt, durationMin);

  const windowFrom = addMinutes(startsAt, -durationMin);
  const windowTo = addMinutes(endsAt, Math.max(service.buffer_post_min ?? 0, 60));
  const slots = await listSlots({
    staffId: payload.staffId,
    serviceId: payload.serviceId,
    from: windowFrom,
    to: windowTo,
  });
  const hasSlot = slots.some(
    (slot) => slot.staffId === payload.staffId && slot.start.getTime() === startsAt.getTime(),
  );
  if (!hasSlot) {
    throw new Error('Selected slot is no longer available.');
  }

  let addOnTotal = 0;
  let addOnRows: AddOnRow[] = [];
  if (payload.addOnIds.length > 0) {
    const { data: addOns, error: addOnError } = await supabase
      .from('add_ons')
      .select('id, price')
      .in('id', payload.addOnIds);
    if (addOnError) throw addOnError;
    addOnRows = (addOns as AddOnRow[] | null) ?? [];
    const missing = payload.addOnIds.filter((id) => !addOnRows.some((row) => row.id === id));
    if (missing.length > 0) {
      throw new Error(`Unknown add-ons: ${missing.join(', ')}`);
    }
    addOnTotal = addOnRows.reduce((sum, row) => sum + normalisePrice(row.price), 0);
  }

  const priceService = normalisePrice(service.base_price);
  const appointmentInsert = {
    staff_id: payload.staffId,
    client_id: payload.clientId,
    pet_id: payload.petId ?? null,
    service_id: payload.serviceId,
    starts_at: toIso(startsAt),
    ends_at: toIso(endsAt),
    price_service: priceService,
    price_addons: addOnTotal,
    discount: payload.discount,
    tax: payload.tax,
    status: payload.status ?? 'booked',
    notes: payload.notes ?? null,
    created_by: payload.createdBy ?? null,
  };

  const { data: inserted, error: insertError } = await supabase
    .from('appointments')
    .insert(appointmentInsert)
    .select('id')
    .single();
  if (insertError) throw insertError;

  if (addOnRows.length > 0) {
    const addOnPayload = addOnRows.map((row) => ({
      appointment_id: inserted.id,
      add_on_id: row.id,
      price: normalisePrice(row.price),
    }));
    const { error: addOnInsertError } = await supabase
      .from('appointment_add_ons')
      .upsert(addOnPayload, { onConflict: 'appointment_id,add_on_id' });
    if (addOnInsertError) throw addOnInsertError;
  }

  await supabase.from('audit_log').insert({
    actor_id: payload.createdBy ?? payload.clientId,
    action: 'appointment_created',
    entity: 'appointments',
    entity_id: inserted.id,
  });

  return {
    id: inserted.id,
    startsAt,
    endsAt,
    priceService,
    priceAddOns: addOnTotal,
  };
}

export async function updateAppointment(id: string, rawPayload: UpdateAppointmentInput) {
  const payload = updateAppointmentSchema.parse(rawPayload);
  const supabase = getSupabaseAdmin();
  const existing = await fetchAppointment(id);

  const updates: Record<string, unknown> = {};
  if (payload.status) updates.status = payload.status;
  if (payload.discount !== undefined) updates.discount = payload.discount;
  if (payload.tax !== undefined) updates.tax = payload.tax;
  if (payload.notes !== undefined) updates.notes = payload.notes;

  if (Object.keys(updates).length === 0) return existing;

  const { data, error } = await supabase
    .from('appointments')
    .update(updates)
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (error) throw error;

  await supabase.from('audit_log').insert({
    actor_id: existing.created_by,
    action: 'appointment_updated',
    entity: 'appointments',
    entity_id: id,
  });

  return data ?? existing;
}

export async function cancelAppointment(id: string, reason?: string) {
  const payload: CancelAppointmentInput = cancelAppointmentSchema.parse({ id, reason });
  const supabase = getSupabaseAdmin();
  const appointment = await fetchAppointment(payload.id);

  const updates: Record<string, unknown> = { status: 'canceled' };
  if (payload.reason) {
    const existingNotes = appointment.notes?.trim();
    const newNote = `Cancellation reason: ${payload.reason}`;
    updates.notes = existingNotes ? `${existingNotes}\n${newNote}` : newNote;
  }

  const { data, error } = await supabase
    .from('appointments')
    .update(updates)
    .eq('id', payload.id)
    .select('*')
    .maybeSingle();
  if (error) throw error;

  await supabase.from('audit_log').insert({
    actor_id: appointment.created_by,
    action: 'appointment_canceled',
    entity: 'appointments',
    entity_id: payload.id,
  });

  return data ?? appointment;
}

export async function listDay(rawInput: ListDayInput) {
  const input = listDaySchema.parse(rawInput);
  const supabase = getSupabaseAdmin();
  const dayStart = roundToDay(input.date);
  const dayEnd = startOfNextDay(input.date);
  const query = supabase
    .from('appointments')
    .select('*')
    .gte('starts_at', toIso(dayStart))
    .lt('starts_at', toIso(dayEnd))
    .order('starts_at', { ascending: true });
  if (input.staffId) query.eq('staff_id', input.staffId);
  const { data, error } = await query;
  if (error) throw error;
  return (data as AppointmentRow[] | null) ?? [];
}

export async function listWeek(rawInput: ListWeekInput) {
  const input = listWeekSchema.parse(rawInput);
  const supabase = getSupabaseAdmin();
  const weekStart = roundToDay(input.weekStart);
  const weekEnd = startOfNextWeek(input.weekStart);
  const query = supabase
    .from('appointments')
    .select('*')
    .gte('starts_at', toIso(weekStart))
    .lt('starts_at', toIso(weekEnd))
    .order('starts_at', { ascending: true });
  if (input.staffId) query.eq('staff_id', input.staffId);
  const { data, error } = await query;
  if (error) throw error;
  return (data as AppointmentRow[] | null) ?? [];
}

export function computeCommissionBase(appointment: Pick<AppointmentRow, 'price_service' | 'price_addons' | 'discount'>) {
  const servicePrice = normalisePrice(appointment.price_service ?? 0);
  const addOnPrice = normalisePrice(appointment.price_addons ?? 0);
  const discount = normalisePrice(appointment.discount ?? 0);
  return servicePrice + addOnPrice - discount;
}
