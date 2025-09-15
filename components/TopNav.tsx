"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

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
  const shouldReduceMotion = useReducedMotion();

  const MotionLink = motion(Link);

  const hoverAnimation = shouldReduceMotion
    ? undefined
    : {
        y: -2,
        scale: 1.04,
      };

  const hoverTransition = shouldReduceMotion
    ? undefined
    : {
        type: "spring" as const,
        stiffness: 350,
        damping: 26,
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
        <nav className="relative flex flex-wrap items-center justify-end gap-2 text-sm">
          {navLinks.map((link) => {
            const isActive = pathname?.startsWith(link.href);
            return (
              <MotionLink
                key={link.href}
                href={link.href}
                className={clsx(
                  "nav-link relative overflow-hidden",
                  isActive
                    ? "bg-white/25 text-white shadow-sm"
                    : "text-white/80 hover:text-white"
                )}
                whileHover={hoverAnimation}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
                transition={hoverTransition}
              >
                <span className="relative z-10 flex items-center justify-center">
                  {link.label}
                </span>
                <AnimatePresence>
                  {isActive && (
                    <motion.span
                      layoutId="nav-active-indicator"
                      className="absolute inset-0 z-0 rounded-full bg-white/25"
                      initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.8 }}
                      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                      transition={
                        shouldReduceMotion
                          ? { duration: 0 }
                          : { duration: 0.3, ease: 'easeOut' as const }
                      }
                    />
                  )}
                </AnimatePresence>
              </MotionLink>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
