import TopNav from "@/components/TopNav";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import { Nunito } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import { mapEmployeeRowToProfile } from "@/lib/auth/profile";
import type { EmployeeProfile } from "@/lib/auth/profile";

export const metadata = {
  title: "Scruffy Butts",
  description: "Operations console for the grooming team",
};
export const runtime = "nodejs";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  let initialProfile: EmployeeProfile | null = null;

  if (session?.user?.email) {
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("id,name,role,app_permissions")
        .eq("email", session.user.email)
        .maybeSingle();

      if (!error) {
        initialProfile = mapEmployeeRowToProfile(data);
      } else {
        console.error("Failed to fetch initial profile", error);
      }
    } catch (error) {
      console.error("Unexpected error fetching initial profile", error);
    }
  }

  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${nunito.variable} font-sans text-brand-navy antialiased`}> 
        <AuthProvider initialSession={session} initialProfile={initialProfile}>
          <div className="relative flex min-h-screen flex-col overflow-hidden">
            <div className="pointer-events-none absolute inset-0 -z-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.35),transparent_60%),radial-gradient(circle_at_bottom,_rgba(14,165,233,0.25),transparent_60%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(34,211,238,0.12),rgba(124,58,237,0.18),transparent)] opacity-80 blur-3xl" />
              <div className="absolute left-1/2 top-1/3 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(248,113,113,0.18),transparent_65%)] blur-[140px]" />
              <div className="absolute -left-32 top-[18%] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,_rgba(34,211,238,0.22),transparent_70%)] blur-[180px]" />
              <div className="absolute -right-40 bottom-[-10%] h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,_rgba(248,250,252,0.12),transparent_70%)] blur-[200px]" />
            </div>
            <div className="pointer-events-none absolute inset-x-0 -z-10 top-0 h-40 bg-gradient-to-b from-[#070D1F] via-transparent to-transparent opacity-90" />
            <TopNav />
            <main className="relative z-10 flex-1 pb-16">{children}</main>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-60 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
