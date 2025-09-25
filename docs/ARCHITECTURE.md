# SB App Architecture (Bible)

## Roles
- Master Account: one per business. Full control.
- Manager, Front Desk, Groomer, Bather: invited by the Master Account or a Manager.
- Client: default for new auth users unless invited as staff.

## Tenancy
- `businesses` = root. `profiles.business_id` links users to a business.
- `employees.business_id` mirrors profiles for staff.
- Other tables derive business via joins (e.g., appointments -> employees -> profiles.business_id).

## Onboarding
- First signup calls `/api/onboarding/first-owner` to create business and promote caller to Master.
- Later signups remain Client until invited.

## Staff Invites
- `/api/staff/invite`: Master/Manager creates invite with role.
- `/api/staff/accept-invite`: invited user accepts; profile role + business_id set; employees row ensured.

## Transfer Master
- `/api/admin/transfer-master`: current Master can transfer to another user in same business.

## Notifications, Scheduling, Photos
- Notifications: tokens in `notification_tokens`; audit in `audit_log`.
- Availability/Blackout: `availability_rules`, `blackout_dates`.
- Pet photos: `pet_photos` (bigint pet_id).

## RLS (high level)
- Scope queries by `profiles.business_id` OR by joins that resolve to a single business.
- Policies must ensure `auth.uid()` belongs to the same business to see data.

## File Map (new endpoints)
- `app/api/onboarding/first-owner/route.ts`
- `app/api/staff/invite/route.ts`
- `app/api/staff/accept-invite/route.ts`
- `app/api/admin/transfer-master/route.ts`

## Next Steps (optional)
- Add `business_id` columns to appointments/services and enforce via RLS.
- Email integration for invites.
- Owner-facing onboarding UI wizard.
