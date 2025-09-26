-- Seed data for core scheduling entities

-- Staff
insert into public.employees (id, name, email, phone, role, status, commission_rate, app_permissions, initials, bio, calendar_color_class, profile_slug)
values
  (1, 'Sasha Taylor', 'sasha@scruffybutts.test', '+1-555-0101', 'Master Groomer', 'Active', 0.25, '{"is_manager": true}'::jsonb, 'ST', 'Specialises in hand scissoring and anxious pups.', 'bg-gradient-to-br from-amber-200/80 via-amber-300/70 to-amber-400/80 text-slate-900', 'sasha-taylor'),
  (2, 'Myles Chen', 'myles@scruffybutts.test', '+1-555-0102', 'Senior Groomer', 'Active', 0.2, '{}'::jsonb, 'MC', 'Loves double coats, creative colour and doodles.', 'bg-gradient-to-br from-brand-bubble/80 via-brand-bubble/70 to-brand-lavender/80 text-slate-900', 'myles-chen'),
  (3, 'Imani Hart', 'imani@scruffybutts.test', '+1-555-0103', 'Pet Stylist', 'Active', 0.18, '{}'::jsonb, 'IH', 'Speedy with bath & tidy packages and small breeds.', 'bg-gradient-to-br from-emerald-300/80 via-emerald-400/70 to-emerald-500/80 text-slate-900', 'imani-hart')
on conflict (id) do update set
  name = excluded.name,
  email = excluded.email,
  phone = excluded.phone,
  role = excluded.role,
  status = excluded.status,
  commission_rate = excluded.commission_rate,
  app_permissions = excluded.app_permissions,
  initials = excluded.initials,
  bio = excluded.bio,
  calendar_color_class = excluded.calendar_color_class,
  profile_slug = excluded.profile_slug;

-- Clients
insert into public.clients (id, first_name, last_name, email, phone, notes)
values
  ('6fa3c4c2-6a93-4f63-8f7d-57fdc3b6b001', 'Jordan', 'Rivers', 'jordan@scruffybutts.test', '+1-555-0201', 'Prefers morning drop-offs'),
  ('7c8aa5ef-146c-4a3b-97dc-237ff0d4f8e2', 'Ritika', 'Kaur', 'ritika@scruffybutts.test', '+1-555-0202', 'Always books Frodo for blueberry facials')
on conflict (id) do update set
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  email = excluded.email,
  phone = excluded.phone,
  notes = excluded.notes;

-- Pets
insert into public.pets (id, client_id, name, breed, notes)
values
  ('93f1d7c1-2aa0-4a5e-9f9f-8fb4d6f2b101', '6fa3c4c2-6a93-4f63-8f7d-57fdc3b6b001', 'Mocha', 'Cockapoo', 'Loves hypoallergenic shampoo'),
  ('6c7a4c15-53d4-4ef5-8e57-17cd8e719eab', '7c8aa5ef-146c-4a3b-97dc-237ff0d4f8e2', 'Frodo', 'Mini Labradoodle', 'Owner picks up early'),
  ('5d3ce79b-b3d3-428c-a0d7-7f5d5054f4f9', '7c8aa5ef-146c-4a3b-97dc-237ff0d4f8e2', 'Nova', 'Husky', null)
on conflict (id) do update set
  client_id = excluded.client_id,
  name = excluded.name,
  breed = excluded.breed,
  notes = excluded.notes;

-- Services
insert into public.services (id, name, description, duration_min, base_price, buffer_pre_min, buffer_post_min, color_class)
values
  ('3a4cf0ed-a46c-4b22-9021-4b0dc6cc1001', 'Full Groom', 'Full groom including haircut, bath and nail trim.', 90, 85, 10, 15, 'bg-gradient-to-r from-brand-bubble/40 via-brand-bubble/25 to-transparent text-white'),
  ('c5c8d942-a497-4b09-86d7-6a46f6d98202', 'Bath & Blowout', 'Deep clean bath with blowout finish.', 70, 60, 5, 10, 'bg-gradient-to-r from-sky-400/40 via-sky-400/20 to-transparent text-white'),
  ('0d69b37a-1f47-4460-966d-2fa1e2c5b003', 'Paw Spa Package', 'Quick pamper session for paws and coat.', 45, 45, 0, 5, 'bg-gradient-to-r from-emerald-400/40 via-emerald-300/25 to-transparent text-white')
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  duration_min = excluded.duration_min,
  base_price = excluded.base_price,
  buffer_pre_min = excluded.buffer_pre_min,
  buffer_post_min = excluded.buffer_post_min,
  color_class = excluded.color_class;

-- Service sizes
insert into public.service_sizes (id, service_id, label, multiplier, sort_order)
values
  ('8823f6c5-54a0-4faf-97ae-75f1ba1a7001', '3a4cf0ed-a46c-4b22-9021-4b0dc6cc1001', 'Toy', 1.00, 0),
  ('3d793488-5b38-4a26-9fbb-4d9b92c07002', '3a4cf0ed-a46c-4b22-9021-4b0dc6cc1001', 'Small', 1.20, 1),
  ('9c68a469-cce1-40d9-8e5e-2b2946b8f003', '3a4cf0ed-a46c-4b22-9021-4b0dc6cc1001', 'Medium', 1.45, 2),
  ('9b44d48d-44b9-4d95-8903-2c1c65898004', '3a4cf0ed-a46c-4b22-9021-4b0dc6cc1001', 'Large', 1.75, 3),
  ('f4fa32c1-e5f2-4337-9f8f-96d5f77b6005', 'c5c8d942-a497-4b09-86d7-6a46f6d98202', 'Toy', 1.00, 0),
  ('f89841b6-2751-4f3a-9b78-d3db142f9006', 'c5c8d942-a497-4b09-86d7-6a46f6d98202', 'Small', 1.10, 1),
  ('838b1be6-8448-4c42-a602-9cfce8db1007', 'c5c8d942-a497-4b09-86d7-6a46f6d98202', 'Medium', 1.25, 2),
  ('662674e4-9c1f-489b-a9b3-6b5ec3a3c008', 'c5c8d942-a497-4b09-86d7-6a46f6d98202', 'Large', 1.50, 3),
  ('a1ed7bdc-58f5-4ca4-8bdf-19b4ae5e5009', '0d69b37a-1f47-4460-966d-2fa1e2c5b003', 'Toy', 1.00, 0),
  ('f71bd419-7de1-4a5f-9582-8d408079c010', '0d69b37a-1f47-4460-966d-2fa1e2c5b003', 'Small', 1.15, 1),
  ('d351a943-e9d5-4d7b-9c58-31710c825011', '0d69b37a-1f47-4460-966d-2fa1e2c5b003', 'Medium', 1.30, 2),
  ('fb9f00b3-5c5a-44ee-8db6-5a692243f012', '0d69b37a-1f47-4460-966d-2fa1e2c5b003', 'Large', 1.50, 3)
on conflict (id) do update set
  label = excluded.label,
  multiplier = excluded.multiplier,
  sort_order = excluded.sort_order;

-- Add-ons
insert into public.add_ons (id, name, description, price)
values
  ('72932ce3-2d3f-4c46-83a4-3f8d667a9001', 'Teeth brushing', 'Gentle teeth brushing with enzymatic toothpaste.', 12),
  ('8447f1c5-5d36-4a69-aacd-2a40145a6002', 'Blueberry facial', 'Brightening facial treatment for the muzzle.', 15),
  ('7f91c0f3-0470-4a1f-8304-3e9f6fcb4003', 'Shed Guard', 'De-shedding treatment for heavy coats.', 20),
  ('ce4f2237-9f5a-44b3-8454-97f12b6c6004', 'Pawdicure', 'Nail trim, file, and pad balm.', 18)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price;

-- Service add-on availability
insert into public.service_add_ons (service_id, add_on_id)
values
  ('3a4cf0ed-a46c-4b22-9021-4b0dc6cc1001', '72932ce3-2d3f-4c46-83a4-3f8d667a9001'),
  ('3a4cf0ed-a46c-4b22-9021-4b0dc6cc1001', '7f91c0f3-0470-4a1f-8304-3e9f6fcb4003'),
  ('c5c8d942-a497-4b09-86d7-6a46f6d98202', 'ce4f2237-9f5a-44b3-8454-97f12b6c6004'),
  ('c5c8d942-a497-4b09-86d7-6a46f6d98202', '8447f1c5-5d36-4a69-aacd-2a40145a6002'),
  ('0d69b37a-1f47-4460-966d-2fa1e2c5b003', '8447f1c5-5d36-4a69-aacd-2a40145a6002'),
  ('0d69b37a-1f47-4460-966d-2fa1e2c5b003', '72932ce3-2d3f-4c46-83a4-3f8d667a9001')
on conflict do nothing;

-- Appointments
insert into public.appointments (id, employee_id, client_id, pet_id, service_id, service_size_id, start_time, end_time, price, price_addons, discount, tax, status, notes)
values
  ('b38f558f-3df4-4b81-9cf5-6f1a36517001', 1, '6fa3c4c2-6a93-4f63-8f7d-57fdc3b6b001', '93f1d7c1-2aa0-4a5e-9f9f-8fb4d6f2b101', '3a4cf0ed-a46c-4b22-9021-4b0dc6cc1001', '9c68a469-cce1-40d9-8e5e-2b2946b8f003', timezone('utc', now()) - interval '1 day', timezone('utc', now()) - interval '1 day' + interval '90 minutes', 123, 12, 0, 8, 'completed', 'Prefers hypoallergenic shampoo'),
  ('cd29caa6-f4a4-4f9a-8ce3-6acf91a6a002', 2, '7c8aa5ef-146c-4a3b-97dc-237ff0d4f8e2', '6c7a4c15-53d4-4ef5-8e57-17cd8e719eab', 'c5c8d942-a497-4b09-86d7-6a46f6d98202', 'f89841b6-2751-4f3a-9b78-d3db142f9006', timezone('utc', now()) + interval '1 day', timezone('utc', now()) + interval '1 day' + interval '70 minutes', 72, 18, 5, 6, 'booked', 'Owner will pick up early'),
  ('f7f4dd7e-96a9-4e59-9cc8-3f2a8a14b003', 3, '7c8aa5ef-146c-4a3b-97dc-237ff0d4f8e2', '5d3ce79b-b3d3-428c-a0d7-7f5d5054f4f9', '0d69b37a-1f47-4460-966d-2fa1e2c5b003', 'fb9f00b3-5c5a-44ee-8db6-5a692243f012', timezone('utc', now()) + interval '2 days', timezone('utc', now()) + interval '2 days' + interval '45 minutes', 68, 15, 0, 5, 'booked', null)
on conflict (id) do update set
  employee_id = excluded.employee_id,
  client_id = excluded.client_id,
  pet_id = excluded.pet_id,
  service_id = excluded.service_id,
  service_size_id = excluded.service_size_id,
  start_time = excluded.start_time,
  end_time = excluded.end_time,
  price = excluded.price,
  price_addons = excluded.price_addons,
  discount = excluded.discount,
  tax = excluded.tax,
  status = excluded.status,
  notes = excluded.notes;

-- Appointment add-ons
insert into public.appointment_add_ons (appointment_id, add_on_id, price)
values
  ('b38f558f-3df4-4b81-9cf5-6f1a36517001', '72932ce3-2d3f-4c46-83a4-3f8d667a9001', 12),
  ('cd29caa6-f4a4-4f9a-8ce3-6acf91a6a002', 'ce4f2237-9f5a-44b3-8454-97f12b6c6004', 18),
  ('cd29caa6-f4a4-4f9a-8ce3-6acf91a6a002', '8447f1c5-5d36-4a69-aacd-2a40145a6002', 15),
  ('f7f4dd7e-96a9-4e59-9cc8-3f2a8a14b003', '8447f1c5-5d36-4a69-aacd-2a40145a6002', 15)
on conflict do nothing;
