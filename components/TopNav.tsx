"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/calendar", label: "Calendar" },
  { href: "/clients", label: "Clients" },
  { href: "/employees", label: "Employees" },
  { href: "/reports", label: "Reports" },
  { href: "/messages", label: "Messages" },
  { href: "/settings", label: "Settings" },
];

export default function TopNav() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 flex justify-center px-4 pt-6">
      <div className="glass-panel relative flex w-full max-w-6xl items-center justify-between px-5 py-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-4 text-white">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-white/90 text-2xl shadow-inner ring-4 ring-white/40 transition-transform duration-300 group-hover:-rotate-12 sm:h-12 sm:w-12">
            🐾
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-[0.6rem] font-semibold uppercase tracking-[0.4em] text-white/70 sm:text-xs">Scruffy</span>
            <span className="text-xl font-black text-white transition-colors duration-300 group-hover:text-brand-cream sm:text-2xl">
              Butts
            </span>
          </div>
        </Link>
        <button
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((open) => !open)}
          className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:hidden"
        >
          {isMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
        </button>
        <nav
          className={clsx(
            "md:static md:flex md:flex-wrap md:items-center md:justify-end md:gap-2 md:text-sm",
            isMenuOpen
              ? "absolute left-0 right-0 top-full z-30 mt-3 flex flex-col gap-2 rounded-3xl border border-white/20 bg-brand-navy/90 p-4 text-base shadow-xl backdrop-blur md:relative md:mt-0 md:flex md:flex-row md:rounded-full md:border-0 md:bg-transparent md:p-0 md:text-sm md:shadow-none"
              : "hidden md:flex"
          )}
        >
          {navLinks.map((link) => {
            const isActive = pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "nav-link w-full text-center md:w-auto",
                  isActive
                    ? "bg-white/25 text-white shadow-sm"
                    : "text-white/80 hover:text-white"
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
