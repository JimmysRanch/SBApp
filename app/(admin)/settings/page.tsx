export default function SettingsHome() {
  const cards = [
    { href: '/settings/business', title: 'Business Settings', desc: 'Hours, closures, branding' },
    { href: '/settings/roles', title: 'Roles & Permissions', desc: 'Roles, permissions, master' },
    { href: '/settings/calendar', title: 'Appointments & Calendar', desc: 'Defaults, cancellations, reminders' },
    { href: '/settings/system', title: 'System Preferences', desc: 'Theme, timezone, feature flags' },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {cards.map(c => (
        <a key={c.href} href={c.href} className="rounded-lg border p-4 hover:bg-neutral-50">
          <h3 className="font-semibold">{c.title}</h3>
          <p className="text-sm opacity-70">{c.desc}</p>
        </a>
      ))}
    </div>
  );
}
