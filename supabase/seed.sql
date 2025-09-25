-- Seed data for staff module
insert into public.employees (id, name, email, phone, role, status, commission_rate, app_permissions)
values
  (1, 'Alex Groomer', 'alex@scruffybutts.test', '+1-555-0100', 'Manager', 'Active', 0.2, '{"is_manager": true, "can_manage_discounts": true}'::jsonb)
on conflict (id) do update set
  name = excluded.name,
  email = excluded.email,
  phone = excluded.phone,
  role = excluded.role,
  status = excluded.status,
  commission_rate = excluded.commission_rate,
  app_permissions = excluded.app_permissions;

insert into public.staff_goals (staff_id, weekly_revenue_target, desired_dogs_per_day)
values
  (1, 1500, 6)
on conflict (staff_id) do update set
  weekly_revenue_target = excluded.weekly_revenue_target,
  desired_dogs_per_day = excluded.desired_dogs_per_day;

insert into public.appointments (id, employee_id, start_time, end_time, service, price, status, pet_name)
values
  (1001, 1, timezone('utc', now()) - interval '1 day', timezone('utc', now()) - interval '1 day' + interval '1 hour', 'Full Groom', 85, 'completed', 'Biscuit'),
  (1002, 1, timezone('utc', now()) + interval '1 day', timezone('utc', now()) + interval '1 day' + interval '1 hour', 'Bath & Brush', 45, 'scheduled', 'Mochi')
on conflict (id) do update set
  employee_id = excluded.employee_id,
  start_time = excluded.start_time,
  end_time = excluded.end_time,
  service = excluded.service,
  price = excluded.price,
  status = excluded.status,
  pet_name = excluded.pet_name;
