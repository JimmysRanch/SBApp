import TopNav from "@/components/TopNav";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";

export const metadata = {
  title: "Scruffy Butts",
  description: "Grooming dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TopNav />
        <main>
          <AuthProvider>{children}</AuthProvider>
        </main>
      </body>
    </html>
  );
}