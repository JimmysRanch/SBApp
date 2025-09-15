"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import Avatar from '@/components/ui/Avatar'

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/clients', label: 'Clients' },
  { href: '/employees', label: 'Employees' },
  { href: '/reports', label: 'Reports' },
  { href: '/messages', label: 'Messages' },
  { href: '/settings', label: 'Settings' }
]

export default function SiteHeader() {
  const pathname = usePathname()
  return (
    <header className="sb-gradient text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between p-4">
        <Link href="/" className="font-semibold">ScruffyButts</Link>
        <nav className="hidden gap-6 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'pb-1',
                pathname.startsWith(item.href) && 'border-b-2 border-accent'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center">
          <Avatar name="User" />
        </div>
      </div>
    </header>
  )
}
