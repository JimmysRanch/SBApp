// app/layout.tsx
export const dynamic = 'force-dynamic';   // string, not object
export const revalidate = 0;              // number (0) or false

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
