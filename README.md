# Scruffy Butts App

## Environment Variables

The following environment variables must be set before running or deploying the app:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`

Create an `.env.local` file based on `.env.local.example` and populate these values with your Supabase project credentials. The
service role key is only used by server-side routes (such as employee creation) and must never be exposed in client-side code.

When deploying to Vercel, set `NEXT_PUBLIC_SITE_URL` to the exact preview or production domain (for example,
`https://your-preview.vercel.app`) without a trailing slash. Use the same URL in Supabase's Authentication settings (Site URL and
Redirect URLs) so Supabase returns users to the correct domain during sign-in.

### Web push setup

The notification endpoints currently stub out the Web Push implementation, but they expect VAPID environment variables to be
available when full delivery is enabled. When you are ready to send real browser push notifications:

1. Install the [`web-push`](https://github.com/web-push-libs/web-push) CLI locally and run `npx web-push generate-vapid-keys`.
2. Copy the generated private key to `VAPID_PRIVATE_KEY` and the `mailto:` contact (or URL) to `VAPID_SUBJECT` in your `.env.local`.
3. Provide the matching public key to the client-side subscription flow when implementing Web Push in the UI.

Until the real implementation is wired up you can leave placeholder values for these variables so the server routes can read them
without failing.
