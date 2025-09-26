"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { useAuth } from "@/components/AuthProvider";
import { navItemsForRole } from "@/lib/auth/access";
import LogoutButton from "@/components/LogoutButton";
import PushToggle from "@/components/PushToggle";

export default function TopNav() {
  const { loading, role, roleLabel, profile } = useAuth();
  const pathname = usePathname() ?? "/";

  const navItems = useMemo(() => {
    if (!role || role === "guest") return [];
    return navItemsForRole(role);
  }, [role]);

  const badge = loading ? "…" : roleLabel ?? "Guest";
  const firstName = useMemo(() => {
    if (loading) return "Loading…";
    const fullName = profile?.fullName?.trim();
    if (fullName) {
      const [first] = fullName.split(/\s+/);
      if (first) return first;
    }
    const email = profile?.email ?? "";
    if (email) {
      const [local] = email.split("@");
      if (local) return local;
      return email;
    }
    return "Guest";
  }, [loading, profile]);

  return (
    <header className="flex w-full flex-wrap items-center justify-between gap-6">
      <nav className="flex flex-wrap items-center gap-2">
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
      <div className="flex flex-1 items-start justify-end gap-4">
        <PushToggle />
        <div className="flex flex-col items-center text-center text-white/90">
          <span className="text-sm font-semibold leading-tight" title={firstName}>
            {firstName}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wide text-white/70">
            {badge}
          </span>
          <div className="mt-1.5">
            <LogoutButton />
          </div>
        </div>
      </div>
    </header>
  );
}
