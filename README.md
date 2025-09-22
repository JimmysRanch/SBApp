# Scruffy Butts App

## Environment Variables

The following environment variables must be set before running or deploying the app:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Create an `.env.local` file based on `.env.local.example` and populate these values with your Supabase project credentials. The
service role key is only used by server-side routes (such as employee creation) and must never be exposed in client-side code.
