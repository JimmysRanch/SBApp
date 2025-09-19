// app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
  title: 'Scruffy Butts',
  description: 'Grooming management',
};

async function getUser() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        // set/remove are no-ops in RSC; middleware handles them
        set: () => {},
        remove: () => {},
      },
    }
  );
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, Arial' }}>
        {user && (
          <header style={{ borderBottom: '1px solid #eee', padding: '10px 16px' }}>
            <nav style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <a href="/">Dashboard</a>
              <a href="/calendar">Calendar</a>
              <a href="/clients">Clients</a>
              <a href="/employees">Staff</a>
              <a href="/reports">Reports</a>
              <a href="/messages">Messages</a>
              <a href="/settings">Settings</a>
            </nav>
          </header>
        )}
        <main style={{ padding: 16 }}>{children}</main>
    </body>
    </html>
  );
}
