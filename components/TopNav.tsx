"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  CalendarDaysIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  HomeModernIcon,
  PlusCircleIcon,
  UsersIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

import { useAuth } from "@/components/AuthProvider";

const navLinks = [
  { href: "/dashboard", label: "Overview", icon: HomeModernIcon },
  { href: "/calendar", label: "Schedule", icon: CalendarDaysIcon },
  { href: "/clients", label: "Clients", icon: UsersIcon },
  { href: "/employees", label: "Team", icon: UserGroupIcon },
  { href: "/reports", label: "Reports", icon: ChartBarIcon },
  { href: "/messages", label: "Inbox", icon: ChatBubbleLeftRightIcon },
  { href: "/settings", label: "Settings", icon: Cog6ToothIcon },
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
    <aside className="relative z-40 hidden w-72 shrink-0 border-r border-slate-200/80 bg-white/80 px-6 pb-8 pt-9 shadow-xl shadow-slate-200/80 backdrop-blur lg:flex xl:w-80">
      <div className="absolute inset-x-0 bottom-12 h-40 rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
      <div className="flex w-full flex-col gap-8">
        <Link href="/dashboard" className="relative inline-flex items-center gap-3 text-left">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-xl font-semibold text-white shadow-lg">
            🐾
          </span>
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">Scruffy</span>
            <p className="text-xl font-bold text-brand-charcoal">Butts HQ</p>
          </div>
        </Link>

        <nav className="relative flex flex-1 flex-col gap-1">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname?.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={clsx(
                  "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition", 
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm shadow-primary/15"
                    : "text-slate-500 hover:bg-slate-100 hover:text-brand-charcoal"
                )}
              >
                <Icon className={clsx("h-5 w-5", isActive ? "text-primary" : "text-slate-400 group-hover:text-primary") } aria-hidden="true" />
                <span>{label}</span>
              </Link>
            );
          })}
          <Link
            href="/book"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-secondary via-secondary-dark to-primary px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-secondary/40 transition hover:brightness-105"
          >
            <PlusCircleIcon className="h-5 w-5" aria-hidden="true" />
            Book appointment
          </Link>
        </nav>

        <div className="relative mt-auto space-y-4 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-lg">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Signed in</p>
            <p className="mt-1 text-sm font-semibold text-brand-charcoal">{displayName ?? session.user.email}</p>
            {role && <p className="text-xs text-slate-500">{role}</p>}
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-brand-charcoal transition hover:border-primary/50 hover:text-primary"
            disabled={loading}
          >
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
