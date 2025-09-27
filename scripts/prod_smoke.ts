import { createClient } from '@supabase/supabase-js'
import { addMinutes } from 'date-fns'

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env

async function main() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  const tag = Date.now()
  const staffName = `Prod Smoke Staff ${tag}`
  const clientName = `Prod Smoke Client ${tag}`
  const petName = `Prod Smoke Pet ${tag}`

  let businessId: string | null = null
  {
    const { data, error } = await admin.from('business').select('id').limit(1).maybeSingle()
    if (!error && data?.id) businessId = data.id
  }

  const staffInsert: any = { display_name: staffName }
  if (businessId) staffInsert.business_id = businessId

  const { data: staff, error: staffErr } = await admin
    .from('staff')
    .insert(staffInsert)
    .select()
    .single()
  if (staffErr) throw new Error('Staff create failed: ' + staffErr.message)

  const { data: client, error: clientErr } = await admin
    .from('clients')
    .insert({ display_name: clientName })
    .select()
    .single()
  if (clientErr) throw new Error('Client create failed: ' + clientErr.message)

  const { data: pet, error: petErr } = await admin
    .from('pets')
    .insert({ client_id: client.id, name: petName, species: 'dog' })
    .select()
    .single()
  if (petErr) throw new Error('Pet create failed: ' + petErr.message)

  const start = new Date()
  const end = addMinutes(start, 30)
  const { data: appointment, error: apptErr } = await admin
    .from('appointments')
    .insert({
      staff_id: staff.id,
      client_id: client.id,
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      status: 'scheduled'
    })
    .select()
    .single()
  if (apptErr) throw new Error('Appointment create failed: ' + apptErr.message)

  const { data: apptUpd, error: apptUpdErr } = await admin
    .from('appointments')
    .update({ status: 'finished' })
    .eq('id', appointment.id)
    .select()
    .single()
  if (apptUpdErr) throw new Error('Appointment status update failed: ' + apptUpdErr.message)

  const { data: message, error: msgErr } = await admin
    .from('messages')
    .insert({
      client_id: client.id,
      direction: 'outbound',
      body: `Smoke test message ${tag}`
    })
    .select()
    .single()
  if (msgErr) throw new Error('Message send failed: ' + msgErr.message)

  let settings: any = null
  const { error: settingsCheckErr } = await admin.from('settings').select('id').eq('id', 1).limit(1)
  if (!settingsCheckErr) {
    const upd = await admin
      .from('settings')
      .update({ quiet_hours_start: '21:00', quiet_hours_end: '07:00' })
      .eq('id', 1)
      .select()
      .maybeSingle()
    settings = upd.data ?? null
  }

  console.log(JSON.stringify({
    staff, client, pet,
    appointment_initial: appointment,
    appointment_updated: apptUpd,
    message,
    settings
  }, null, 2))
}

main().catch(e => {
  console.error('SMOKE_TEST_FAILURE:', e)
  process.exit(1)
})
