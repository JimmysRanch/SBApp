"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { useAuth } from "@/components/AuthProvider";
import { navItemsForRole } from "@/lib/auth/access";

export default function TopNav() {
  const { loading, role, roleLabel, profile } = useAuth();
  const pathname = usePathname() ?? "/";

  const navItems = useMemo(() => {
    if (!role || role === "guest") return [];
    return navItemsForRole(role);
  }, [role]);

  const badge = loading ? "…" : roleLabel ?? "Guest";
  const name = profile?.email ?? "User";

  return (
    <header className="flex w-full items-center justify-between gap-6">
      <nav className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto whitespace-nowrap">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
                isActive
                  ? "bg-white/20 text-white shadow-lg shadow-white/20"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="flex flex-shrink-0 items-center gap-3 text-sm">
        <span className="truncate max-w-[12rem] text-white/90" title={name}>
          {name}
        </span>
        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/80">
          {badge}
        </span>
      </div>
    </header>
  );
}
