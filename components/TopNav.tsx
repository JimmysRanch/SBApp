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
      <div className="glass-panel flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="group flex items-center gap-4 text-brand-navy">
          <span className="relative grid h-12 w-12 place-items-center overflow-hidden rounded-full bg-[radial-gradient(circle_at_top,_rgba(56,242,255,0.7),_rgba(8,17,37,0.6))] text-2xl shadow-[inset_0_1px_3px_rgba(255,255,255,0.4)] ring-2 ring-[rgba(76,201,240,0.35)] transition-transform duration-300 group-hover:-rotate-12">
            <span className="relative z-10">🐾</span>
            <span className="absolute inset-0 -z-10 bg-[radial-gradient(circle,_rgba(139,92,246,0.35),_transparent_65%)]" />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-semibold uppercase tracking-[0.4em] text-brand-navy/70">
              Scruffy
            </span>
            <span className="text-2xl font-black text-brand-navy transition-colors duration-300 group-hover:text-brand-sky">
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
                  "nav-link",
                  isActive
                    ? "bg-[linear-gradient(120deg,rgba(56,242,255,0.26),rgba(139,92,246,0.22))] text-brand-navy shadow-[0_12px_32px_-18px_rgba(56,242,255,0.55)]"
                    : "hover:text-brand-navy"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3">
          <div className="hidden text-right text-xs leading-tight text-brand-navy/70 sm:flex sm:flex-col sm:items-end">
            {displayName && (
              <span className="font-semibold text-brand-navy">{displayName}</span>
            )}
            {role && <span className="uppercase tracking-[0.22em] text-[11px] text-brand-navy/60">{role}</span>}
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-full bg-[linear-gradient(130deg,rgba(56,242,255,0.24),rgba(139,92,246,0.18))] px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-brand-navy transition-all duration-200 hover:bg-[linear-gradient(130deg,rgba(56,242,255,0.32),rgba(139,92,246,0.26))] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
