export type Role =
  | 'master'
  | 'admin'
  | 'manager'
  | 'front_desk'
  | 'groomer'
  | 'bather'
  | 'client';

const roleLabels: Record<Role, string> = {
  master: 'Master Account',
  admin: 'Admin',
  manager: 'Manager',
  front_desk: 'Front Desk',
  groomer: 'Groomer',
  bather: 'Bather',
  client: 'Client',
};

const canonicalRoles = new Set<Role>([
  'master',
  'admin',
  'manager',
  'front_desk',
  'groomer',
  'bather',
  'client',
]);

export type UserProfile = {
  id: string;
  full_name: string | null;
  role: Role;
};

type RawProfileRow = {
  id?: unknown;
  full_name?: unknown;
  role?: unknown;
};

export function normaliseName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const roleAliases: Record<string, Role> = {
  master: 'master',
  'master account': 'master',
  'master_account': 'master',
  masteraccount: 'master',
  admin: 'admin',
  administrator: 'admin',
  manager: 'manager',
  'senior groomer': 'manager',
  'senior_groomer': 'manager',
  groomer: 'groomer',
  bather: 'bather',
  'front desk': 'front_desk',
  'front_desk': 'front_desk',
  frontdesk: 'front_desk',
  receptionist: 'front_desk',
  client: 'client',
  clients: 'client',
};

export function normaliseRole(value: unknown): Role {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return 'client';
    }
    const alias = roleAliases[trimmed.toLowerCase()];
    if (alias) return alias;
    const lowered = trimmed.toLowerCase();
    if (isRole(lowered)) return lowered;
  }
  return 'client';
}

function isRole(value: string): value is Role {
  return (
    value === 'master' ||
    value === 'admin' ||
    value === 'manager' ||
    value === 'front_desk' ||
    value === 'groomer' ||
    value === 'bather' ||
    value === 'client'
  );
}

export function roleLabel(role: Role): string {
  return roleLabels[role] ?? role;
}

export function describeRole(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const slug = normaliseRole(trimmed);
  if (slug === 'client' && trimmed.toLowerCase() !== 'client') {
    return trimmed;
  }
  return roleLabel(slug);
}

export function isCanonicalRole(value: Role): boolean {
  return canonicalRoles.has(value);
}

export function mapProfileRow(row: RawProfileRow | null | undefined): UserProfile | null {
  if (!row) return null;

  const id = typeof row.id === 'string' ? row.id : null;
  if (!id) return null;

  return {
    id,
    full_name: normaliseName(row.full_name),
    role: normaliseRole(row.role),
  };
}
