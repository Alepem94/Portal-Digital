import { useAuth } from '../context/AuthContext';
import { useDatabase } from '../context/DatabaseContext';
import { PermissionKey } from '../types';
import { normalizeAppRole, resolvePermissions } from '../lib/permissions';

export function usePermissions() {
  const { user, userRole, appRole, permissions: sessionPermissions } = useAuth();
  const { db } = useDatabase();

  const currentUserObj = db.users.find((u) => u.email.toLowerCase() === (user?.email || '').toLowerCase());
  const resolvedAppRole = normalizeAppRole(currentUserObj?.role || userRole, currentUserObj?.appRole || appRole);
  const resolvedPermissions = resolvePermissions(currentUserObj || {
    role: userRole || '',
    appRole: appRole || undefined,
    permissions: sessionPermissions,
  });

  const isAdmin = resolvedAppRole === 'admin';
  const isFullAccess = isAdmin;
  const currentUserName = currentUserObj?.name || '';
  const currentUserEmail = user?.email || '';

  const hasPermission = (permission: PermissionKey) => {
    return isAdmin || resolvedPermissions[permission] === true;
  };

  const canEditGeneral = hasPermission('canEditAccounts');
  const canManageTools = hasPermission('canManageTools');
  const canManageUsers = hasPermission('canManageUsers');
  const canViewCredentials = hasPermission('canViewCredentials');
  const canRevealCredentials = hasPermission('canRevealCredentials');

  const canAccessBrand = (brandId: string) => {
    if (isFullAccess) return true;
    if (!brandId) return false;

    const brand = db.brands.find((b) => b.id === brandId);
    if (!brand) return false;

    const hasTeamAccess =
      brand.accountManager === currentUserName ||
      brand.brandStrategist === currentUserName ||
      (brand.analysts?.includes?.(currentUserName) ?? false) ||
      (brand.cms?.includes?.(currentUserName) ?? false);

    if (hasTeamAccess) return true;

    const hasAdAccess =
      db.adAccounts?.some(
        (a) =>
          a.brandId === brandId &&
          (a.email === currentUserEmail || a.user === currentUserName)
      ) ?? false;

    if (hasAdAccess) return true;

    const hasSocialAccess =
      db.socialProfiles?.some(
        (p) =>
          p.brandId === brandId &&
          (p.emailLinked === currentUserEmail ||
            p.loginUser === currentUserName ||
            p.username === currentUserName)
      ) ?? false;

    return hasSocialAccess;
  };

  const canEditBrand = (brandId: string) => {
    if (isFullAccess) return true;
    if (canEditGeneral && canAccessBrand(brandId)) return true;
    return false;
  };

  const getVisibleBrands = () => {
    if (isFullAccess) return db.brands;
    return db.brands.filter((b) => canAccessBrand(b.id));
  };

  const getVisibleClients = () => {
    if (isFullAccess) return db.clients;
    const visibleBrandClientIds = getVisibleBrands().map((b) => b.clientId);
    return db.clients.filter((c) => visibleBrandClientIds.includes(c.id));
  };

  return {
    isAdmin,
    isFullAccess,
    canEditGeneral,
    canManageTools,
    canManageUsers,
    canViewCredentials,
    canRevealCredentials,
    hasPermission,
    permissions: resolvedPermissions,
    appRole: resolvedAppRole,
    canEditBrand,
    canAccessBrand,
    getVisibleBrands,
    getVisibleClients,
    currentUserName,
    currentUserEmail,
  };
}
