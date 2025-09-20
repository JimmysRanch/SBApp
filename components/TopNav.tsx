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
      <div className="glass-panel flex w-full max-w-6xl items-center justify-between px-6 py-4 backdrop-saturate-150">
        <Link href="/" className="group flex items-center gap-4 text-slate-100">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-bubble to-primary text-2xl text-white shadow-lg ring-2 ring-white/20 transition-transform duration-300 group-hover:-rotate-6">
            🐾
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-[11px] font-semibold uppercase tracking-[0.45em] text-white/60">Scruffy</span>
            <span className="text-2xl font-black text-white transition-colors duration-300 group-hover:text-brand-cream">
              Butts
            </span>
          </div>
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-2 text-sm text-slate-200">
          {navLinks.map((link) => {
            const isActive = pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "nav-link",
                  isActive
                    ? "bg-white/15 text-white shadow-sm"
                    : "text-slate-300"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3">
          <div className="hidden text-right text-xs leading-tight text-slate-200 sm:flex sm:flex-col sm:items-end">
            {displayName && (
              <span className="font-semibold text-white">{displayName}</span>
            )}
            {role && <span className="uppercase tracking-[0.22em] text-[11px] text-white/50">{role}</span>}
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-full bg-brand-bubble/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white shadow-sm transition hover:bg-brand-bubble"
            disabled={loading}
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
