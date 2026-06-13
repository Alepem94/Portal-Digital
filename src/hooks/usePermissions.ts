import { useAuth } from '../context/AuthContext';
import { useDatabase } from '../context/DatabaseContext';
import { Brand, PermissionKey } from '../types';
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
  const isFullAccess = isAdmin || resolvedPermissions.canViewAllAccounts === true;
  const currentUserName = currentUserObj?.name || '';
  const currentUserEmail = user?.email || '';
  const allowedClientIds = resolvedPermissions.allowedClientIds || [];
  const allowedBrandIds = resolvedPermissions.allowedBrandIds || [];

  const hasPermission = (permission: PermissionKey) => {
    return isAdmin || resolvedPermissions[permission] === true;
  };

  const canEditGeneral = hasPermission('canEditAccounts');
  const canManageTools = hasPermission('canManageTools');
  const canManageUsers = hasPermission('canManageUsers');
  const canViewCredentials = hasPermission('canViewCredentials');
  const canRevealCredentials = hasPermission('canRevealCredentials');

  const getBrandOperationalRoles = (brand: Brand) => {
    const roles: string[] = [];
    if (!currentUserName) return roles;
    if (brand.accountManager === currentUserName) roles.push('Ejecutiva');
    if (brand.brandStrategist === currentUserName) roles.push('Estrategia');
    if (brand.analysts?.includes?.(currentUserName)) roles.push('Analista');
    if (brand.cms?.includes?.(currentUserName)) roles.push('CM');
    return roles;
  };

  const getOperationalRolesForBrand = (brandId: string) => {
    const brand = db.brands.find((b) => b.id === brandId);
    return brand ? getBrandOperationalRoles(brand) : [];
  };

  const canAccessBrand = (brandId: string) => {
    if (isFullAccess) return true;
    if (!brandId) return false;

    const brand = db.brands.find((b) => b.id === brandId);
    if (!brand) return false;

    return allowedBrandIds.includes(brandId) || allowedClientIds.includes(brand.clientId);
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
    getOperationalRolesForBrand,
    getBrandOperationalRoles,
    getVisibleBrands,
    getVisibleClients,
    currentUserName,
    currentUserEmail,
  };
}
