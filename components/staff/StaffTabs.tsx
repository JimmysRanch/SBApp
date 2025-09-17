'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { name: 'Overview', href: '' },
  { name: 'History', href: '/history' },
  { name: 'Payroll', href: '/payroll' },
  { name: 'Schedule', href: '/schedule' },
  { name: 'Settings', href: '/settings' },
];

export default function StaffTabs({ staffId }: { staffId: string }) {
  const pathname = usePathname();

  return (
    <nav className="mt-4 flex gap-2 overflow-x-auto pb-1">
      {tabs.map((tab) => {
        const href = `/employees/${staffId}${tab.href}`;
        const isActive = pathname === href || (!!tab.href && pathname?.startsWith(href));
        return (
          <Link
            key={tab.name}
            href={href}
            className={clsx(
              'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
              'border-neutral-200 text-neutral-600 hover:bg-neutral-50',
              isActive && 'border-brand-blue bg-brand-blue text-white shadow-sm hover:bg-brand-blue'
            )}
          >
            {tab.name}
          </Link>
        );
      })}
    </nav>
  );
}
