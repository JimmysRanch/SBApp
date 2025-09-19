"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

import { useAuth } from "@/components/AuthProvider";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/calendar", label: "Calendar" },
  { href: "/clients", label: "Clients" },
  { href: "/employees", label: "Staff" },
  { href: "/reports", label: "Reports" },
  { href: "/messages", label: "Messages" },
  { href: "/settings", label: "Settings" },
];

export default function TopNav() {
  const pathname = usePathname();
  const { loading, session, displayName, role, signOut } = useAuth();

  if (!session) return null;

  const handleSignOut = () => {
    if (loading) return;
    void signOut();
  };

  return (
    <header className="sticky top-0 z-40 flex justify-center px-4 pt-6">
      <div className="relative flex w-full max-w-6xl flex-wrap items-center justify-between gap-6 overflow-hidden rounded-[2.75rem] border border-white/25 bg-white/10 px-6 py-5 shadow-hyper backdrop-blur-3xl md:px-10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-electric-pink/40 blur-3xl" />
          <div className="absolute right-[-14rem] top-0 h-72 w-72 rounded-full bg-electric-orange/35 blur-3xl" />
          <div className="absolute left-1/2 top-0 h-px w-[140%] -translate-x-1/2 bg-gradient-to-r from-transparent via-white/35 to-transparent" />
          <div className="absolute bottom-0 left-1/2 h-24 w-[120%] -translate-x-1/2 bg-gradient-to-r from-electric-blue/20 via-transparent to-electric-purple/20" />
        </div>
        <Link href="/" className="group relative z-10 flex items-center gap-4 text-white no-underline">
          <span className="grid h-14 w-14 place-items-center rounded-3xl bg-gradient-to-br from-electric-pink via-electric-orange to-electric-purple text-2xl shadow-[0_25px_45px_-25px_rgba(120,92,255,0.55)] transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-105">
            🎉
          </span>
          <div className="leading-tight">
            <span className="font-display text-[0.55rem] uppercase tracking-[0.7em] text-white/70">Scruffy</span>
            <div className="mt-1 flex items-center gap-2">
              <span className="font-display text-[1.85rem] uppercase tracking-[0.35em] drop-shadow-[0_10px_25px_rgba(0,0,0,0.35)]">Butts</span>
              <span className="hidden rounded-full bg-white/20 px-3 py-1 text-[0.55rem] font-semibold uppercase tracking-[0.45em] text-white/80 sm:inline-flex">
                Remix
              </span>
            </div>
            <p className="mt-1 text-[0.6rem] uppercase tracking-[0.5em] text-electric-aqua/80">Grooming Party HQ</p>
          </div>
        </Link>
        <nav className="relative z-10 order-last flex w-full flex-wrap items-center justify-center gap-2 md:order-none md:w-auto">
          {navLinks.map((link) => {
            const isActive = pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  'group relative overflow-hidden rounded-full px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.35em] transition-all duration-300',
                  isActive
                    ? 'bg-white text-brand-navy shadow-[0_18px_45px_-25px_rgba(255,255,255,0.45)]'
                    : 'bg-white/10 text-white/75 hover:bg-white/20 hover:text-white'
                )}
              >
                <span className="relative z-10">{link.label}</span>
                <span className="pointer-events-none absolute inset-0 translate-y-[110%] bg-gradient-to-r from-white/40 via-transparent to-white/40 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100" />
              </Link>
            );
          })}
        </nav>
        <div className="relative z-10 flex w-full flex-wrap items-center justify-between gap-4 md:w-auto md:flex-nowrap md:justify-end">
          <div className="flex flex-col text-xs leading-tight text-white/75 sm:items-end">
            {displayName && (
              <span className="font-display text-sm uppercase tracking-[0.35em] text-white">
                {displayName}
              </span>
            )}
            {role && (
              <span className="mt-1 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[0.55rem] uppercase tracking-[0.4em] text-white/80">
                <span className="h-1.5 w-1.5 rounded-full bg-electric-lime" />
                {role}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-electric-orange via-electric-pink to-electric-purple px-5 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-white shadow-[0_28px_55px_-25px_rgba(120,92,255,0.55)] transition-transform duration-300 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-4 focus-visible:ring-electric-pink/40 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
          >
            Exit Party
          </button>
        </div>
      </div>
    </header>
  );
}
