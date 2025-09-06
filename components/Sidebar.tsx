import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/book', label: 'Book' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/clients', label: 'Clients' },
  { href: '/reports', label: 'Reports' },
  { href: '/messages', label: 'Messages' },
  { href: '/agreement', label: 'Agreement' },
  { href: '/settings', label: 'Settings' },
]

export default function Sidebar() {
  const pathname = usePathname()
  return (
    <nav className="hidden md:flex flex-col w-60 min-h-screen bg-gradient-to-b from-primary-dark to-primary-light text-white p-4 space-y-4">
      <div className="font-bold text-xl mb-8 px-2">Scruffy Butts</div>
      {navItems.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={clsx(
            'px-3 py-2 rounded-lg hover:bg-primary-dark/40 transition-colors',
            pathname === href && 'bg-primary-dark/70'
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}