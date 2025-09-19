import './globals.css';
import { createServerClient } from '@supabase/ssr';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Scruffy Butts',
  description: 'Grooming management',
};

async function getUser() {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
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
