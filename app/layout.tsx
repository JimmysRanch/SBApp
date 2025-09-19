import TopNav from "@/components/TopNav";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import { Plus_Jakarta_Sans } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import { mapEmployeeRowToProfile } from "@/lib/auth/profile";
import type { EmployeeProfile } from "@/lib/auth/profile";

export const metadata = {
  title: "Scruffy Butts",
  description: "Modern grooming command center",
};
export const runtime = "nodejs";

const plusJakarta = Plus_Jakarta_Sans({
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
      <body className={`${plusJakarta.variable} font-sans text-brand-charcoal antialiased`}> 
        <AuthProvider initialSession={session} initialProfile={initialProfile}>
          <div className="relative flex min-h-screen overflow-hidden">
            {session && <TopNav />}
            <div className="relative flex min-h-screen flex-1 flex-col">
              {session && (
                <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/70 px-6 py-5 backdrop-blur lg:px-10">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Welcome back</p>
                      <h1 className="text-2xl font-semibold text-brand-charcoal">
                        {initialProfile?.name ?? session.user.email ?? "Team member"}
                      </h1>
                    </div>
                    <div className="flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center">
                      {initialProfile?.role && (
                        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 font-medium text-slate-600 shadow-sm">
                          <span className="h-2 w-2 rounded-full bg-emerald-400" />
                          {initialProfile.role}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 font-medium text-slate-600 shadow-sm">
                        <span className="h-2 w-2 rounded-full bg-sky-400" />
                        All systems operational
                      </span>
                    </div>
                  </div>
                </header>
              )}
              <main className="relative z-10 flex-1 pb-16 lg:pb-20">{children}</main>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}