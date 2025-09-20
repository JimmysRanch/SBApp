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
      <div
        className="glass-panel flex w-full max-w-6xl items-center justify-between overflow-hidden px-6 py-4 ring-1 ring-white/10 bg-[linear-gradient(135deg,rgba(5,6,18,0.92)_0%,rgba(8,36,90,0.66)_45%,rgba(5,6,18,0.88)_100%)]"
      >
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-[160px]" />
        </div>
        <Link href="/" className="group relative flex items-center gap-4 text-white">
          <span className="grid h-12 w-12 place-items-center rounded-[1.4rem] border border-white/15 bg-[radial-gradient(circle_at_top_left,rgba(124,92,255,0.35),rgba(5,6,18,0.92))] text-2xl text-brand-bubble shadow-[inset_0_1px_6px_rgba(255,255,255,0.12)] transition-all duration-300 group-hover:-rotate-12 group-hover:scale-105">
            🐾
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-semibold uppercase tracking-[0.4em] text-white/60">Scruffy</span>
            <span className="text-2xl font-black text-white transition-colors duration-300 group-hover:text-brand-bubble">
              Butts
            </span>
          </div>
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-2 text-sm">
          {navLinks.map((link) => {
            const isActive = pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "nav-link backdrop-blur-sm transition-all duration-200",
                  isActive
                    ? "bg-white/12 text-white shadow-[0_12px_32px_-18px_rgba(30,123,255,0.85)] ring-1 ring-white/15"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3">
          <div className="hidden text-right text-xs leading-tight text-white/70 sm:flex sm:flex-col sm:items-end">
            {displayName && (
              <span className="font-semibold text-white">{displayName}</span>
            )}
            {role && <span className="uppercase tracking-[0.22em] text-[11px] text-white/50">{role}</span>}
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-full bg-gradient-to-r from-brand-bubble to-brand-bubbleDark px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white shadow-[0_22px_36px_-22px_rgba(255,102,196,0.85)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_40px_-20px_rgba(255,102,196,0.9)] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
