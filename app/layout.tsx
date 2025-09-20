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
        className={`${nunito.variable} font-sans text-brand-cream/90 antialiased bg-brand-midnight min-h-screen overflow-x-hidden`}
      >
        <AuthProvider initialSession={session} initialProfile={initialProfile}>
          <div className="relative flex min-h-screen flex-col overflow-hidden">
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
              <div className="absolute -left-40 -top-48 h-[28rem] w-[28rem] rounded-full bg-brand-bubble/25 blur-[160px]" />
              <div className="absolute right-[-6rem] top-10 h-[30rem] w-[30rem] rounded-full bg-primary/20 blur-[200px]" />
              <div className="absolute bottom-[-16rem] left-[10%] h-[34rem] w-[34rem] rounded-full bg-brand-blue/30 blur-[200px]" />
              <div className="absolute bottom-[-20rem] right-[-12rem] h-[26rem] w-[26rem] rounded-full bg-brand-bubble/15 blur-[180px]" />
            </div>
            <TopNav />
            <main className="relative z-10 flex-1">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}