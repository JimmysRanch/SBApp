'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import {
  HomeIcon,
  UsersIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  BookOpenIcon,
  ChartBarIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import LogoutButton from '@/components/LogoutButton';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: HomeIcon },
  { href: '/clients', label: 'Clients', icon: UsersIcon },
  { href: '/employees', label: 'Employees', icon: BriefcaseIcon },
  { href: '/calendar', label: 'Calendar', icon: CalendarDaysIcon },
  { href: '/book', label: 'Book', icon: BookOpenIcon },
  { href: '/reports', label: 'Reports', icon: ChartBarIcon },
  { href: '/settings', label: 'Settings', icon: Cog6ToothIcon },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      <aside className="hidden w-64 border-r p-4 md:block">
        <nav className="space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'block rounded px-3 py-2 hover:bg-gray-100',
                pathname?.startsWith(item.href) && 'bg-gray-100 font-medium'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-6 border-t pt-4">
          <LogoutButton />
        </div>
      </aside>
      <nav className="fixed bottom-0 left-0 right-0 flex justify-around border-t bg-white py-2 md:hidden">
        {nav.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex flex-col items-center text-xs',
                pathname?.startsWith(item.href)
                  ? 'text-blue-600'
                  : 'text-gray-600'
              )}
            >
              <Icon className="h-6 w-6" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
