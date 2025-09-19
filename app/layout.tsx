import './globals.css';
import NavGate from './components/NavGate';

export const metadata = {
  title: 'Scruffy Butts',
  description: 'Grooming management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, Arial' }}>
        {/* Top navigation hidden until logged in */}
        <NavGate>
          <header style={{ borderBottom: '1px solid #eee', padding: '10px 16px' }}>
            <nav style={{ display: 'flex', gap: 16 }}>
              <a href="/">Dashboard</a>
              <a href="/calendar">Calendar</a>
              <a href="/clients">Clients</a>
              <a href="/employees">Staff</a>
              <a href="/reports">Reports</a>
              <a href="/settings">Settings</a>
            </nav>
          </header>
        </NavGate>

        <main style={{ padding: 16 }}>{children}</main>
      </body>
    </html>
  );
}
