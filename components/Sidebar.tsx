'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import LogoutButton from '@/components/LogoutButton';

const nav = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/clients', label: 'Clients' },
  { href: '/employees', label: 'Employees' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/book', label: 'Book Appointment' },
  { href: '/reports', label: 'Reports' },
  { href: '/settings', label: 'Settings' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full md:w-64 border-b md:border-r p-4">
      <nav className="flex space-x-2 overflow-x-auto md:block md:space-x-0 md:space-y-1">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'block whitespace-nowrap rounded px-3 py-2 hover:bg-gray-100',
              pathname?.startsWith(item.href) && 'bg-gray-100 font-medium'
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-4 border-t pt-4 md:mt-6">
        <LogoutButton />
      </div>
    </aside>
  );
}
