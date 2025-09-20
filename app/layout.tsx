import TopNav from "@/components/TopNav";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import { Nunito } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import { mapEmployeeRowToProfile } from "@/lib/auth/profile";
import type { EmployeeProfile } from "@/lib/auth/profile";

export const metadata = {
  title: "Scruffy Butts",
  description: "Grooming dashboard",
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
      <body
        className={`${nunito.variable} font-sans text-brand-navy antialiased min-h-screen overflow-x-hidden`}
      >
        <AuthProvider initialSession={session} initialProfile={initialProfile}>
          <div className="relative flex min-h-screen flex-col overflow-hidden">
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
              <div className="absolute -left-40 -top-52 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle_at_top,_rgba(76,201,240,0.32),_rgba(8,17,37,0))] blur-[160px]" />
              <div className="absolute -right-24 top-20 h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle_at_top_right,_rgba(139,92,246,0.28),_rgba(8,17,37,0))] blur-[150px]" />
              <div className="absolute bottom-[-20rem] left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(34,212,191,0.22),_rgba(4,6,11,0))] blur-[160px]" />
              <div className="absolute left-1/3 top-1/4 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(230,236,255,0.12),_rgba(4,6,11,0))] blur-[140px]" />
            </div>
            <TopNav />
            <main className="relative z-10 flex-1">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
