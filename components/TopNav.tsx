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
      <div className="glass-panel relative flex w-full max-w-6xl items-center justify-between overflow-hidden px-8 py-5">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-28 top-[-30%] h-48 w-48 rounded-full bg-primary/35 blur-[140px]" />
          <div className="absolute -right-32 bottom-[-40%] h-64 w-64 rounded-full bg-secondary/25 blur-[150px]" />
        </div>
        <Link href="/" className="group relative flex items-center gap-4 text-white">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-white via-[#F7F3FF] to-[#BDB4FF] text-2xl text-primary shadow-[0_18px_24px_-18px_rgba(5,3,17,0.7)] ring-2 ring-white/30 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:rotate-3">
            🐾
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-semibold uppercase tracking-[0.42em] text-white/60">Scruffy</span>
            <span className="text-2xl font-black text-white transition-colors duration-300 group-hover:text-brand-cream">
              Butts
            </span>
          </div>
        </Link>
        <nav className="relative z-[1] flex flex-wrap items-center justify-end gap-2.5 text-sm">
          {navLinks.map((link) => {
            const isActive = pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  'nav-link',
                  isActive
                    ? 'bg-white/20 text-brand-cream shadow-[0_24px_36px_-24px_rgba(5,3,17,0.85)]'
                    : 'hover:text-brand-cream'
                )}
              >
                <span className="relative z-[1]">{link.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="relative z-[1] flex items-center gap-3">
          <div className="hidden text-right text-xs leading-tight text-white/75 sm:flex sm:flex-col sm:items-end">
            {displayName && (
              <span className="font-semibold text-white">{displayName}</span>
            )}
            {role && <span className="uppercase tracking-[0.24em] text-[11px] text-white/55">{role}</span>}
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-full bg-white/15 px-5 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white transition duration-300 ease-out hover:-translate-y-0.5 hover:bg-white/25 hover:shadow-[0_26px_38px_-24px_rgba(5,3,17,0.8)] disabled:opacity-60"
            disabled={loading}
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
