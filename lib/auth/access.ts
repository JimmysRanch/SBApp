import type { Role } from "./profile";

export type AppRoute =
  | "dashboard"
  | "calendar"
  | "booking"
  | "clients"
  | "staff"
  | "reports"
  | "messages"
  | "settings";

const managerRoles: Role[] = ["master", "admin", "senior_groomer"];
const frontDeskRoles: Role[] = ["receptionist"];
const groomerRoles: Role[] = ["groomer"];
const clientRoles: Role[] = ["client"];

const routeAccess: Record<AppRoute, Role[]> = {
  dashboard: managerRoles,
  calendar: [...managerRoles, ...frontDeskRoles, ...groomerRoles],
  booking: [...managerRoles, ...frontDeskRoles],
  clients: [...managerRoles, ...frontDeskRoles],
  staff: managerRoles,
  reports: managerRoles,
  messages: managerRoles,
  settings: managerRoles,
};

export function isManagerRole(role: Role): boolean {
  return managerRoles.includes(role);
}

export function isFrontDeskRole(role: Role): boolean {
  return frontDeskRoles.includes(role);
}

export function isGroomerRole(role: Role): boolean {
  return groomerRoles.includes(role);
}

export function isClientRole(role: Role): boolean {
  return clientRoles.includes(role);
}

export function canAccessRoute(role: Role, route: AppRoute): boolean {
  const allowed = routeAccess[route];
  if (!allowed) return false;
  return allowed.includes(role);
}

export type NavItem = { href: string; label: string };

export function navItemsForRole(role: Role): NavItem[] {
  if (isClientRole(role)) {
    return [];
  }

  if (isFrontDeskRole(role)) {
    return [
      { href: "/calendar", label: "Calendar" },
      { href: "/booking", label: "Booking" },
      { href: "/clients", label: "Clients" },
    ];
  }

  if (isGroomerRole(role)) {
    return [{ href: "/calendar", label: "Calendar" }];
  }

  return [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/calendar", label: "Calendar" },
    { href: "/booking", label: "Booking" },
    { href: "/clients", label: "Clients" },
    { href: "/staff", label: "Staff" },
    { href: "/reports", label: "Reports" },
    { href: "/messages", label: "Messages" },
    { href: "/settings", label: "Settings" },
  ];
}

export function roleDisplayName(role: Role): string {
  switch (role) {
    case "master":
      return "Master Account";
    case "admin":
      return "Admin";
    case "senior_groomer":
      return "Manager";
    case "groomer":
      return "Groomer";
    case "receptionist":
      return "Front Desk";
    case "client":
    default:
      return "Client";
  }
}
