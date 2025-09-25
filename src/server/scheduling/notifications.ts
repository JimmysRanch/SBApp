import { getSupabaseAdmin } from '../../../lib/supabase/server';
import {
  appointmentIdSchema,
  registerPushTokenSchema,
  type AppointmentIdInput,
  type RegisterPushTokenInput,
} from './schemas';

export async function registerPushToken(rawInput: RegisterPushTokenInput) {
  const input = registerPushTokenSchema.parse(rawInput);
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('notification_tokens')
    .upsert(
      {
        user_id: input.userId,
        platform: input.platform,
        token: input.token,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'token' },
    );
  if (error) throw error;
}

async function logNotification(action: string, rawInput: AppointmentIdInput) {
  const input = appointmentIdSchema.parse(rawInput);
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('audit_log').insert({
    actor_id: input.actorId ?? null,
    action,
    entity: 'appointments',
    entity_id: input.appointmentId,
  });
  if (error) throw error;
}

export async function sendReminder(appointmentId: string, actorId?: string) {
  await logNotification('appointment_reminder_queued', { appointmentId, actorId });
}

export async function sendPickupReady(appointmentId: string, actorId?: string) {
  await logNotification('appointment_pickup_ready', { appointmentId, actorId });
}
