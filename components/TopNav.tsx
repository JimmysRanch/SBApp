"use client";
import Link from "next/link";

export default function TopNav() {
  return (
    <header className="w-full border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary-dark">ScruffyButts</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/calendar">Calendar</Link>
          <Link href="/clients">Clients</Link>
          <Link href="/employees">Employees</Link>
          <Link href="/reports">Reports</Link>
          <Link href="/messages">Messages</Link>
          <Link href="/settings">Settings</Link>
        </nav>
      </div>
    </header>
  );
}
