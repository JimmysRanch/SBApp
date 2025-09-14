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
      <aside className="hidden w-64 rounded-r-3xl bg-gradient-to-b from-primary-light via-primary to-primary-dark p-6 text-white shadow-lg md:flex md:flex-col">
        <div className="mb-8 text-2xl font-extrabold">
          Scruffy<span className="text-secondary-pink">Butts</span>
        </div>
        <nav className="flex-1 space-y-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'block rounded-full px-4 py-2 transition-colors hover:bg-white/20',
                pathname?.startsWith(item.href) && 'bg-white text-primary-dark font-semibold shadow'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-6">
          <LogoutButton />
        </div>
      </aside>
      <nav className="fixed bottom-0 left-0 right-0 flex justify-around bg-gradient-to-br from-primary-light via-primary to-primary-dark py-2 text-white md:hidden">
        {nav.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex flex-col items-center text-xs',
                pathname?.startsWith(item.href)
                  ? 'text-secondary-pink'
                  : 'text-white/70'
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
