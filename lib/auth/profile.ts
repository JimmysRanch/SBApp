export type Role = 'master' | 'manager' | 'front_desk' | 'groomer' | 'client';

export type UserProfile = {
  id: string;
  full_name: string | null;
  role: Role;
  businessId: string | null;
};

type RawProfileRow = {
  id?: unknown;
  full_name?: unknown;
  role?: unknown;
  business_id?: unknown;
};

export function normaliseName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function normaliseRole(value: unknown): Role {
  if (typeof value === 'string') {
    const trimmed = value.trim().toLowerCase();
    if (isRole(trimmed)) return trimmed;
    switch (trimmed) {
      case 'master account':
      case 'owner':
        return 'master';
      case 'admin':
      case 'manager':
      case 'senior_groomer':
      case 'senior groomer':
        return 'manager';
      case 'front desk':
      case 'front_desk':
      case 'receptionist':
        return 'front_desk';
    }
  }
  return 'client';
}

function isRole(value: string): value is Role {
  return ['master', 'manager', 'front_desk', 'groomer', 'client'].includes(value);
}

export function mapProfileRow(row: RawProfileRow | null | undefined): UserProfile | null {
  if (!row) return null;

  const id = typeof row.id === 'string' ? row.id : null;
  if (!id) return null;

  return {
    id,
    full_name: normaliseName(row.full_name),
    role: normaliseRole(row.role),
    businessId: typeof row.business_id === 'string' ? row.business_id : null,
  };
}
