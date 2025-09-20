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
        className={`${nunito.variable} bg-brand-obsidian font-sans text-white/90 antialiased min-h-screen overflow-x-hidden`}
      >
        <AuthProvider initialSession={session} initialProfile={initialProfile}>
          <div className="relative flex min-h-screen flex-col overflow-hidden">
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-obsidian via-brand-navy/60 to-black" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(30,123,255,0.25),transparent_62%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(255,102,196,0.22),transparent_58%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(8,36,90,0.5),transparent_65%)]" />
              <div className="absolute -left-44 -top-40 h-[28rem] w-[28rem] rounded-full bg-primary/20 blur-[220px]" />
              <div className="absolute right-[-20rem] top-1/3 h-[34rem] w-[34rem] rounded-full bg-brand-bubble/25 blur-[240px]" />
              <div className="absolute bottom-[-22rem] left-1/4 h-[38rem] w-[38rem] rounded-full bg-brand-mint/22 blur-[220px]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06),transparent_70%)]" />
            </div>
            <TopNav />
            <main className="relative z-10 flex-1">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}