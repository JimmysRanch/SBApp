export type Role = 'master' | 'admin' | 'senior_groomer' | 'groomer' | 'receptionist' | 'client';

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
  owner: 'master',
  admin: 'admin',
  administrator: 'admin',
  'senior groomer': 'senior_groomer',
  'senior_groomer': 'senior_groomer',
  manager: 'senior_groomer',
  groomer: 'groomer',
  'front desk': 'receptionist',
  'front_desk': 'receptionist',
  receptionist: 'receptionist',
  assistant: 'receptionist',
  client: 'client',
};

export function normaliseRole(value: unknown): Role {
  if (typeof value === 'string') {
    const trimmed = value.trim().toLowerCase();
    const alias = roleAliases[trimmed];
    if (alias) return alias;
    if (isRole(trimmed)) return trimmed;
  }
  return 'client';
}

function isRole(value: string): value is Role {
  return [
    'master',
    'admin',
    'senior_groomer',
    'groomer',
    'receptionist',
    'client',
  ].includes(value);
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
