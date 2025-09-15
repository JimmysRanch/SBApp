"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/calendar", label: "Calendar" },
  { href: "/clients", label: "Clients" },
  { href: "/employees", label: "Employees" },
  { href: "/reports", label: "Reports" },
  { href: "/messages", label: "Messages" },
  { href: "/settings", label: "Settings" }
];

export default function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 flex justify-center px-space-md pt-space-lg">
      <div className="glass-panel flex w-full max-w-6xl items-center justify-between px-space-lg py-space-md">
        <Link href="/" className="group flex items-center gap-space-md text-text-inverse">
          <span className="grid h-space-3xl w-space-3xl place-items-center rounded-full bg-surface-strong text-title-md shadow-inner ring-4 ring-border-highlight transition-transform duration-300 group-hover:-rotate-12">
            🐾
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-label-xs font-emphasis uppercase tracking-eyebrow text-text-inverse-subtle">
              Scruffy
            </span>
            <span className="text-title-md font-brand tracking-brand text-text-inverse transition-colors duration-300 group-hover:text-brand-cream">
              Butts
            </span>
          </div>
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-space-xs text-body-sm">
          {navLinks.map((link) => {
            const isActive = pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "nav-link",
                  isActive
                    ? "bg-surface-overlay text-text-inverse shadow-elevation-sm"
                    : "text-text-inverse-muted hover:text-text-inverse"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
