export type AvailabilityRuleRow = {
  id: string;
  staff_id: string;
  rrule_text: string;
  tz: string | null;
  buffer_pre_min: number | null;
  buffer_post_min: number | null;
};

export type BlackoutRow = {
  id?: string;
  staff_id: string;
  starts_at: string;
  ends_at: string;
};

export type AppointmentRow = {
  id: string;
  staff_id: string | null;
  client_id?: string | null;
  pet_id?: string | null;
  service_id?: string | null;
  starts_at: string;
  ends_at: string;
  price_service?: number | null;
  price_addons?: number | null;
  discount?: number | null;
  tax?: number | null;
  status: string | null;
  notes?: string | null;
  created_by?: string | null;
};

export type ServiceRow = {
  id: string;
  name?: string | null;
  base_price: number;
  duration_min?: number | null;
  buffer_pre_min?: number | null;
  buffer_post_min?: number | null;
};

export type AddOnRow = {
  id: string;
  name?: string | null;
  price: number;
};

export type RescheduleLinkRow = {
  id: string;
  appointment_id: string;
  token: string;
  expires_at: string | null;
  used_at: string | null;
};

export type AppointmentWithServiceRow = AppointmentRow & {
  services: ServiceRow | null;
};
