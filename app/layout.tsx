import './globals.css';
import AuthProvider from '@/components/AuthProvider';

export const metadata = {
  title: 'Scruffy Butts',
  description: 'Grooming dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen text-gray-900 antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
