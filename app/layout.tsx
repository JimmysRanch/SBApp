import TopNav from "@/components/TopNav";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import { Manrope, Playfair_Display } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import { mapEmployeeRowToProfile } from "@/lib/auth/profile";
import type { EmployeeProfile } from "@/lib/auth/profile";

export const metadata = {
  title: "Scruffy Butts",
  description: "Grooming dashboard",
};
export const runtime = "nodejs";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
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
        className={`${manrope.variable} ${playfair.variable} font-sans text-brand-cream/90 antialiased bg-[#020611] min-h-screen overflow-x-hidden`}
      >
        <AuthProvider initialSession={session} initialProfile={initialProfile}>
          <div className="relative flex min-h-screen flex-col overflow-hidden">
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(65,100,246,0.25),_transparent_55%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(243,201,105,0.2),_transparent_60%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(12,22,48,0.9),rgba(2,6,17,0.85))]" />
              <div className="absolute left-1/2 top-1/3 h-[44rem] w-[44rem] -translate-x-1/2 rounded-full bg-brand-lavender/10 blur-[180px]" />
              <div className="absolute -left-32 bottom-[-12rem] h-[36rem] w-[36rem] rounded-full bg-brand-mint/10 blur-[200px]" />
            </div>
            <TopNav />
            <main className="relative z-10 flex-1">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}