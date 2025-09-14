'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/clients', label: 'Clients' },
  { href: '/employees', label: 'Employees' },
  { href: '/reports', label: 'Reports' },
  { href: '/messages', label: 'Messages' },
  { href: '/settings', label: 'Settings' },
]

export default function TopNav() {
  const pathname = usePathname()
  return (
    <header className="bg-primary text-white shadow">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="text-2xl font-extrabold">
          Scruffy<span className="text-secondary-pink">Butts</span>
        </div>
        <nav className="hidden space-x-2 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={clsx(
                'rounded-full px-3 py-2 transition-colors hover:bg-primary-dark',
                pathname?.startsWith(l.href) && 'bg-white text-primary-dark'
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
