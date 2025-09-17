"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type StaffTab = {
  label: string;
  href: string;
};

export default function StaffTabs({ tabs }: { tabs: StaffTab[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
      {tabs.map((tab) => {
        const active = pathname === tab.href || pathname?.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={clsx(
              "rounded-xl px-4 py-2 text-sm font-semibold transition",
              active
                ? "bg-brand-blue text-white shadow"
                : "text-slate-500 hover:bg-slate-100 hover:text-brand-blue"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
