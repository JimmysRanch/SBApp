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
  { href: "/settings", label: "Settings" }
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
      <div className="glass-panel flex w-full max-w-6xl items-center justify-between border-white/5 bg-brand-onyx/80 px-8 py-5 shadow-[0_36px_90px_-45px_rgba(5,12,32,0.9)]">
        <Link href="/" className="group flex items-center gap-4 text-white">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-bubble via-secondary.purple to-primary.light text-lg font-semibold uppercase tracking-[0.3em] shadow-lg shadow-brand-bubble/40 transition-transform duration-300 group-hover:-translate-y-0.5">
            SB
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-[0.6rem] font-semibold uppercase tracking-[0.55em] text-white/50">Scruffy</span>
            <span className="bg-gradient-to-r from-white via-white to-brand-bubble bg-clip-text text-2xl font-semibold text-transparent transition-colors duration-300 group-hover:from-brand-bubble group-hover:via-secondary.purple group-hover:to-primary.light">
              Butts Studio
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
                  "nav-link border border-transparent bg-white/0 backdrop-blur-sm",
                  isActive
                    ? "border-white/15 bg-white/10 text-white shadow-[0_18px_45px_-25px_rgba(5,12,32,0.8)]"
                    : "text-brand-navy/70 hover:border-white/10"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-4">
          <div className="hidden text-right text-xs leading-tight text-white/70 sm:flex sm:flex-col sm:items-end">
            {displayName && <span className="font-semibold text-white">{displayName}</span>}
            {role && <span className="uppercase tracking-[0.28em] text-[11px] text-white/50">{role}</span>}
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-full bg-gradient-to-r from-brand-bubble via-secondary.purple to-primary.light px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-[0_18px_50px_-30px_rgba(255,10,120,0.6)] transition-transform duration-300 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-bubble/50"
            disabled={loading}
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
