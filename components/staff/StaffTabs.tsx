"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { name: "Overview", href: "" },
  { name: "History", href: "/history" },
  { name: "Payroll", href: "/payroll" },
  { name: "Schedule", href: "/schedule" },
  { name: "Settings", href: "/settings" },
];

interface StaffTabsProps {
  staffId: string;
}

export default function StaffTabs({ staffId }: StaffTabsProps) {
  const pathname = usePathname();

  return (
    <nav className="mt-4 flex gap-2 overflow-x-auto">
      {tabs.map((tab) => {
        const href = `/employees/${staffId}${tab.href}`;
        const isActive = pathname === href;

        return (
          <Link
            key={tab.name}
            href={href}
            className={`rounded-lg border px-3 py-2 text-sm transition ${
              isActive ? "bg-neutral-100" : "bg-white hover:bg-neutral-50"
            }`}
          >
            {tab.name}
          </Link>
        );
      })}
    </nav>
  );
}
