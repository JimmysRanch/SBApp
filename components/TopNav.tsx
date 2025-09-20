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
        <nav className="flex flex-wrap items-center justify-end gap-2 text-sm">
          {navLinks.map((link) => {
            const isActive = pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "nav-link nav-link-immersive",
                  isActive
                    ? "bg-white/25 text-white shadow-sm nav-link-immersive--active"
                    : "text-white/80 hover:text-white"
                )}
              >
                <span className="relative z-10">{link.label}</span>
                <span className="nav-link-immersive__light" aria-hidden="true" />
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3">
          <div className="hidden text-right text-xs leading-tight text-white/80 sm:flex sm:flex-col sm:items-end">
            {displayName && (
              <span className="font-semibold text-white">{displayName}</span>
            )}
            {role && <span className="uppercase tracking-[0.22em] text-[11px] text-white/60">{role}</span>}
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-full bg-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-white/30"
            disabled={loading}
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
