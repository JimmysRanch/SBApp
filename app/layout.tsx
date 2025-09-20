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
      <body className={`${nunito.variable} font-sans`}>
        <AuthProvider initialSession={session} initialProfile={initialProfile}>
          <div className="relative flex min-h-screen flex-col overflow-hidden">
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
              <div className="absolute -left-40 -top-[45%] h-[32rem] w-[32rem] rounded-full bg-primary/35 blur-[160px] opacity-90" />
              <div className="absolute right-[-18rem] top-0 h-[28rem] w-[28rem] rounded-full bg-secondary/25 blur-[160px] opacity-80" />
              <div className="absolute inset-x-[-25%] top-[30%] h-72 origin-top bg-[radial-gradient(ellipse_at_center,_rgba(111,227,255,0.25),_transparent_70%)] blur-[140px] opacity-80" />
              <div className="absolute inset-x-[-35%] bottom-[-45%] h-[30rem] bg-[radial-gradient(circle,_rgba(93,245,207,0.25),_transparent_75%)] blur-[220px] opacity-70" />
              <div className="absolute inset-x-[10%] top-[48%] h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-70" />
              <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-white/20 to-transparent opacity-70" />
            </div>
            <TopNav />
            <main className="relative z-10 flex-1">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}