"use client";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";

/**
 * Settings hub page listing all available settings sections.  Includes an
 * additional link for Agreement settings.
 */
export default function Settings() {
  const items = [
    { href: "/settings/business", label: "Business details" },
    { href: "/settings/employees", label: "Employees" },
    { href: "/settings/notifications", label: "Notifications" },
    { href: "/settings/dashboard", label: "Dashboard customization" },
    { href: "/settings/branding", label: "Branding" },
    { href: "/settings/agreement", label: "Agreement" },
  ];
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        <ul className="grid md:grid-cols-2 gap-4">
          {items.map((item) => (
            <li key={item.href} className="p-4 bg-white rounded shadow">
              <Link href={item.href} className="text-blue-600 underline">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}