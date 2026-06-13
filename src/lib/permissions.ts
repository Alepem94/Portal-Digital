import { AppRole, PermissionKey, User, UserPermissions } from '../types';

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  canManageUsers: 'Administrar usuarios y whitelist',
  canEditAccounts: 'Crear y editar cuentas, marcas y activos',
  canManageTools: 'Crear y editar herramientas operativas',
  canViewCredentials: 'Ver secciones de accesos',
  canRevealCredentials: 'Revelar contraseñas',
  canViewFinance: 'Ver presupuestos, cortes y saldos',
  canEditFinance: 'Editar presupuestos, cortes y saldos',
};

export const PERMISSION_KEYS = Object.keys(PERMISSION_LABELS) as PermissionKey[];

export const ADMIN_PERMISSIONS: Record<PermissionKey, boolean> = {
  canManageUsers: true,
  canEditAccounts: true,
  canManageTools: true,
  canViewCredentials: true,
  canRevealCredentials: true,
  canViewFinance: true,
  canEditFinance: true,
};

export const READONLY_PERMISSIONS: Record<PermissionKey, boolean> = {
  canManageUsers: false,
  canEditAccounts: false,
  canManageTools: false,
  canViewCredentials: false,
  canRevealCredentials: false,
  canViewFinance: false,
  canEditFinance: false,
};

const EDITOR_PERMISSIONS: Record<PermissionKey, boolean> = {
  ...READONLY_PERMISSIONS,
  canEditAccounts: true,
  canManageTools: true,
  canViewCredentials: true,
};

export function normalizeAppRole(role?: string | null, appRole?: string | null): AppRole {
  if (appRole === 'admin' || appRole === 'member') return appRole;

  const normalizedRole = (role || '').toLowerCase().trim();
  if (
    normalizedRole === 'administrador' ||
    normalizedRole === 'head de medios digitales' ||
    normalizedRole.includes('admin')
  ) {
    return 'admin';
  }

  return 'member';
}

export function defaultPermissionsForRole(role?: string | null, appRole?: string | null) {
  const resolvedRole = normalizeAppRole(role, appRole);
  if (resolvedRole === 'admin') return ADMIN_PERMISSIONS;

  const normalizedRole = (role || '').toLowerCase().trim();
  if (normalizedRole === 'editor') return EDITOR_PERMISSIONS;

  return READONLY_PERMISSIONS;
}

export function resolvePermissions(user?: Pick<User, 'role' | 'appRole' | 'permissions' | 'canEdit'> | null) {
  if (!user) return READONLY_PERMISSIONS;
  const base = defaultPermissionsForRole(user.role, user.appRole);
  const legacyEdit = user.canEdit ? { canEditAccounts: true, canManageTools: true } : {};
  return {
    ...base,
    ...legacyEdit,
    ...(user.permissions || {}),
  };
}

export function hasPermission(
  user: Pick<User, 'role' | 'appRole' | 'permissions' | 'canEdit'> | null | undefined,
  permission: PermissionKey
) {
  return normalizeAppRole(user?.role, user?.appRole) === 'admin' || resolvePermissions(user)[permission] === true;
}

export function createPermissions(overrides: UserPermissions = {}) {
  return {
    ...READONLY_PERMISSIONS,
    ...overrides,
  };
}
