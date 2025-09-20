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
    <header className="sticky top-0 z-40 flex justify-center px-4 pt-8">
      <div className="relative isolate flex w-full max-w-6xl flex-col gap-5 overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-950/70 px-6 py-5 shadow-[0_30px_70px_-35px_rgba(15,23,42,0.9)] backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between">
        <span className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div className="relative flex items-center gap-4">
          <div className="relative grid h-14 w-14 place-items-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-brand-bubble/60 via-primary/50 to-transparent shadow-[0_18px_35px_-20px_rgba(34,211,238,0.7)]">
            <span className="text-2xl">🐺</span>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),transparent_70%)]" />
          </div>
          <div className="flex flex-col leading-tight">
            <Link href="/" className="text-lg font-semibold uppercase tracking-[0.6em] text-slate-300">
              Scruffy Butts
            </Link>
            <span className="text-sm font-medium text-slate-400">
              Elevated grooming operations hub
            </span>
          </div>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-2 md:justify-end">
          {navLinks.map((link) => {
            const isActive = pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx("nav-link", isActive && "shadow-[0_14px_30px_-20px_rgba(34,211,238,0.6)]")}
                data-active={isActive ? "true" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex w-full flex-1 items-center justify-between gap-4 sm:w-auto sm:flex-none sm:justify-end">
          <div className="flex flex-1 flex-col text-xs uppercase tracking-[0.3em] text-slate-400 sm:items-end">
            {displayName && (
              <span className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-cream/80">
                {displayName}
              </span>
            )}
            {role && <span className="text-[0.65rem] text-slate-500">{role}</span>}
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-brand-bubble/40 bg-brand-bubble/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-brand-cream transition hover:border-brand-bubble hover:bg-brand-bubble/20"
            disabled={loading}
          >
            <span>Log out</span>
            <span className="hidden text-base sm:inline">→</span>
            <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-40" />
          </button>
        </div>
      </div>
    </header>
  );
}
