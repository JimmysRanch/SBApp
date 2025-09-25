export type Role =
  | 'Master Account'
  | 'Admin'
  | 'Manager'
  | 'Front Desk'
  | 'Groomer'
  | 'Bather'
  | 'Client';

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
  master: 'Master Account',
  'master account': 'Master Account',
  'master_account': 'Master Account',
  masteraccount: 'Master Account',
  admin: 'Admin',
  administrator: 'Admin',
  manager: 'Manager',
  'senior groomer': 'Manager',
  'senior_groomer': 'Manager',
  groomer: 'Groomer',
  bather: 'Bather',
  'front desk': 'Front Desk',
  'front_desk': 'Front Desk',
  frontdesk: 'Front Desk',
  receptionist: 'Front Desk',
  client: 'Client',
  clients: 'Client',
};

export function normaliseRole(value: unknown): Role {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return 'Client';
    }
    const alias = roleAliases[trimmed.toLowerCase()];
    if (alias) return alias;
    if (isRole(trimmed)) return trimmed;
  }
  return 'Client';
}

function isRole(value: string): value is Role {
  return (
    value === 'Master Account' ||
    value === 'Admin' ||
    value === 'Manager' ||
    value === 'Front Desk' ||
    value === 'Groomer' ||
    value === 'Bather' ||
    value === 'Client'
  );
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
