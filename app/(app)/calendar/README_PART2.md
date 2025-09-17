# Calendar Part 2
Included: DB table + APIs (GET/POST/PATCH/DELETE), hooks (SWR), store (Zustand), Month/Week/Day views, create/edit/delete dialogs, basic filters.
Required env:
- NEXT_PUBLIC_SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
Run:
1) Apply SQL migration in Supabase.
2) npm i zod zustand swr @supabase/supabase-js
3) npm run build
