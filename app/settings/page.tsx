"use client";
import PageContainer from "@/components/PageContainer";
import Card from "@/components/Card";
import Link from "next/link";

/**
 * Settings hub page listing all available settings sections.  Includes an
 * additional link for Agreement settings.
 */
export default function Settings() {
  const items = [
    { href: "/settings/business", label: "Business details" },
    { href: "/settings/notifications", label: "Notifications" },
    { href: "/settings/dashboard", label: "Dashboard customization" },
    { href: "/settings/branding", label: "Branding" },
    { href: "/settings/agreement", label: "Agreement" },
  ];
  return (
    <PageContainer>
      <Card>
        <h1 className="mb-6 text-3xl font-bold text-primary-dark">Settings</h1>
        <ul className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <li key={item.href} className="rounded-2xl bg-white p-4 shadow">
              <Link href={item.href} className="text-primary underline">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </PageContainer>
  );
}