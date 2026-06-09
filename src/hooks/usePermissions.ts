import { useAuth } from '../context/AuthContext';
import { useDatabase } from '../context/DatabaseContext';

export function usePermissions() {
  const { user, userRole } = useAuth();
  const { db } = useDatabase();

  const role = (userRole || '').toLowerCase().trim();
  const isFullAccess =
    role === 'administrador' ||
    role === 'adminstrador' ||
    role === 'head de medios digitales' ||
    role.includes('admin');

  // ✅ Corrección: usar la columna correcta del usuario
  // (en tu DB la columna se llama "email", no "user_email")
  const currentUserObj = db.users.find((u: any) => u.email === user?.email);

  const currentUserName = currentUserObj?.name || '';
  const currentUserEmail = user?.email || '';

  const canEditGeneral = currentUserObj?.canEdit === true;

  const canAccessBrand = (brandId: string) => {
    if (isFullAccess) return true;
    if (!brandId) return false;

    const brand = db.brands.find((b: any) => b.id === brandId);
    if (!brand) return false;

    // Check if user is assigned to the brand team
    const hasTeamAccess =
      brand.accountManager === currentUserName ||
      brand.brandStrategist === currentUserName ||
      (brand.analysts?.includes?.(currentUserName) ?? false) ||
      (brand.cms?.includes?.(currentUserName) ?? false);

    if (hasTeamAccess) return true;

    // Optional: check other tables for access
    const hasAdAccess =
      db.adAccounts?.some(
        (a: any) =>
          a.brandId === brandId &&
          (a.email === currentUserEmail || a.user === currentUserName)
      ) ?? false;

    if (hasAdAccess) return true;

    const hasSocialAccess =
      db.socialProfiles?.some(
        (p: any) =>
          p.brandId === brandId &&
          (p.emailLinked === currentUserEmail ||
            p.loginUser === currentUserName ||
            p.username === currentUserName)
      ) ?? false;

    if (hasSocialAccess) return true;

    return false;
  };

  const canEditBrand = (brandId: string) => {
    if (isFullAccess) return true;
    if (canEditGeneral && canAccessBrand(brandId)) return true;
    return false;
  };

  const getVisibleBrands = () => {
    if (isFullAccess) return db.brands;
    return db.brands.filter((b: any) => canAccessBrand(b.id));
  };

  const getVisibleClients = () => {
    if (isFullAccess) return db.clients;

    // Client is visible if the user has access to AT LEAST ONE brand of that client.
    const visibleBrandClientIds = getVisibleBrands().map((b: any) => b.clientId);
    return db.clients.filter((c: any) => visibleBrandClientIds.includes(c.id));
  };

  return {
    isFullAccess,
    canEditGeneral,
    canEditBrand,
    canAccessBrand,
    getVisibleBrands,
    getVisibleClients,
    currentUserName,
    currentUserEmail,
  };
}
