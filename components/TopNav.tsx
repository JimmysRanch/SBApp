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
    <header className="sticky top-0 z-40 flex justify-center px-6 pb-4 pt-8">
      <div className="glass-panel w-full max-w-6xl">
        <div className="relative flex items-center justify-between gap-6 rounded-[2.25rem] bg-[rgba(6,14,34,0.72)] px-8 py-5 text-brand-cream">
          <div className="absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <Link href="/" className="group relative flex items-center gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-blue/70 via-brand-blue/40 to-brand-mint/60 text-2xl text-white shadow-[0_12px_30px_rgba(38,68,198,0.45)] transition-transform duration-300 group-hover:-rotate-6">
              🐾
            </span>
            <div className="flex flex-col leading-tight">
              <span className="text-[11px] font-semibold uppercase tracking-[0.45em] text-brand-cream/70">Scruffy</span>
              <span className="font-serif text-2xl font-semibold text-brand-cream transition-colors duration-300 group-hover:text-white">
                Butts
              </span>
            </div>
          </Link>
          <nav className="flex flex-1 flex-wrap items-center justify-end gap-2 text-sm">
            {navLinks.map((link) => {
              const isActive = pathname?.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={clsx(
                    "nav-link relative px-4 py-2",
                    isActive ? "text-brand-cream" : "text-brand-cream/70"
                  )}
                >
                  <span className="relative z-10">{link.label}</span>
                  <span
                    className={clsx(
                      "absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-brand-blue/70 via-brand-mint/50 to-transparent opacity-0 blur-[1px] transition-opacity",
                      isActive && "opacity-100"
                    )}
                  />
                  {isActive && (
                    <span className="pointer-events-none absolute inset-[2px] -z-10 rounded-full bg-white/5" />
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-4">
            <div className="hidden text-right text-xs leading-tight text-brand-cream/80 sm:flex sm:flex-col sm:items-end">
              {displayName && (
                <span className="text-sm font-semibold text-brand-cream">{displayName}</span>
              )}
              {role && <span className="uppercase tracking-[0.32em] text-[10px] text-brand-cream/60">{role}</span>}
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="relative overflow-hidden rounded-full bg-white/10 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.32em] text-brand-cream transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading}
            >
              <span className="relative z-10">Log out</span>
              <span className="absolute inset-0 -z-10 bg-gradient-to-r from-white/10 via-transparent to-white/10 opacity-0 transition-opacity hover:opacity-100" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
