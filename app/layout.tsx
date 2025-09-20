import Link from "next/link";
import { Nunito } from "next/font/google";

import AuthProvider from "@/components/AuthProvider";
import LogoutButton from "@/components/LogoutButton";
import { mapProfileRow, type Role, type UserProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

export const metadata = {
  title: "Scruffy Butts",
  description: "Grooming dashboard",
};
export const runtime = "nodejs";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-sans",
});

const TABS: Record<Role, { label: string; href: string }[]> = {
  master: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Calendar", href: "/calendar" },
    { label: "Clients", href: "/clients" },
    { label: "Staff", href: "/staff" },
    { label: "Reports", href: "/reports" },
    { label: "Messages", href: "/messages" },
    { label: "Settings", href: "/settings" },
  ],
  admin: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Calendar", href: "/calendar" },
    { label: "Clients", href: "/clients" },
    { label: "Staff", href: "/staff" },
    { label: "Reports", href: "/reports" },
    { label: "Messages", href: "/messages" },
    { label: "Settings", href: "/settings" },
  ],
  senior_groomer: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Calendar", href: "/calendar" },
    { label: "Clients", href: "/clients" },
    { label: "Messages", href: "/messages" },
  ],
  groomer: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Calendar", href: "/calendar" },
    { label: "Clients", href: "/clients" },
    { label: "Messages", href: "/messages" },
  ],
  receptionist: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Calendar", href: "/calendar" },
    { label: "Clients", href: "/clients" },
    { label: "Messages", href: "/messages" },
  ],
  client: [
    { label: "My Appointments", href: "/client/appointments" },
    { label: "Profile", href: "/client/profile" },
  ],
};

const ROLE_LABEL: Record<Role, string> = {
  master: "Master Account",
  admin: "Admin",
  senior_groomer: "Senior Groomer",
  groomer: "Groomer",
  receptionist: "Receptionist",
  client: "Client",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  let profile: UserProfile | null = null;
  let role: Role = "client";

  if (session?.user) {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("id", session.user.id)
      .maybeSingle();
    profile = mapProfileRow(data) ?? null;
    if (profile) {
      role = profile.role;
    }
  }

  const tabs = TABS[role] ?? [];
  const roleLabel = ROLE_LABEL[role] ?? role;

  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${nunito.variable} bg-brand-obsidian font-sans text-white/90 antialiased min-h-screen overflow-x-hidden`}
      >
        <AuthProvider initialSession={session} initialProfile={profile}>
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
            <header className="sticky top-0 z-40 flex justify-center px-4 pt-6">
              <div className="glass-panel flex w-full max-w-6xl items-center gap-6 px-6 py-4">
                <Link href="/" className="group flex items-center gap-4 text-white">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-white/90 text-2xl shadow-inner ring-4 ring-white/40 transition-transform duration-300 group-hover:-rotate-12">
                    🐾
                  </span>
                  <div className="flex flex-col leading-tight">
                    <span className="text-xs font-semibold uppercase tracking-[0.4em] text-white/70">Scruffy</span>
                    <span className="text-2xl font-black text-white transition-colors duration-300 group-hover:text-brand-cream">
                      Butts
                    </span>
                  </div>
                </Link>
                <nav className="flex flex-1 flex-wrap items-center gap-2 text-sm">
                  {tabs.map((tab) => (
                    <Link
                      key={tab.href}
                      href={tab.href}
                      className="nav-link text-white/80 transition hover:text-white"
                    >
                      {tab.label}
                    </Link>
                  ))}
                </nav>
                <div className="flex items-center gap-4 text-right text-xs leading-tight text-white/80">
                  <div className="hidden sm:flex sm:flex-col sm:items-end">
                    <span className="font-semibold text-white">{profile?.full_name ?? session?.user?.email ?? ""}</span>
                    <span className="uppercase tracking-[0.22em] text-[11px] text-white/60">{roleLabel}</span>
                  </div>
                  <LogoutButton />
                </div>
              </div>
            </header>
            <main className="relative z-10 flex-1">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
