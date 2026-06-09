import { useAuth } from '../context/AuthContext';
import { useDatabase } from '../context/DatabaseContext';

export function usePermissions() {
  const { user, userRole } = useAuth();
  const { db } = useDatabase();

  const role = (userRole || '').toLowerCase().trim();
  const isFullAccess = role === 'administrador' || role === 'adminstrador' || role === 'head de medios digitales' || role.includes('admin');
  
  const currentUserObj = db.users.find(u => u.user_email === user?.email);
  const currentUserName = currentUserObj?.name || '';
  const currentUserEmail = user?.email || '';
  
  const canEditGeneral = currentUserObj?.canEdit === true;

  const canEditBrand = (brandId: string) => {
    if (isFullAccess) return true;
    if (canEditGeneral && canAccessBrand(brandId)) return true;
    return false;
  };

  const canAccessBrand = (brandId: string) => {
    if (isFullAccess) return true;
    const brand = db.brands.find(b => b.id === brandId);
    if (!brand) return false;
    
    // Check if user is assigned to the brand team
    const hasTeamAccess = 
      (brand.accountManager === currentUserName) ||
      (brand.brandStrategist === currentUserName) ||
      (brand.analysts?.includes(currentUserName)) ||
      (brand.cms?.includes(currentUserName));

    if (hasTeamAccess) return true;

    // Optional: check other tables for access
    const hasAdAccess = db.adAccounts?.some(a => a.brandId === brandId && (a.email === currentUserEmail || a.user === currentUserName));
    if (hasAdAccess) return true;
    
    const hasSocialAccess = db.socialProfiles?.some(p => p.brandId === brandId && (p.emailLinked === currentUserEmail || p.loginUser === currentUserName || p.username === currentUserName));
    if (hasSocialAccess) return true;

    return false;
  };

  const getVisibleBrands = () => {
    if (isFullAccess) return db.brands;
    return db.brands.filter(b => canAccessBrand(b.id));
  };

  const getVisibleClients = () => {
    if (isFullAccess) return db.clients;
    // Client is visible if the user has access to AT LEAST ONE brand of that client.
    const visibleBrandClientIds = getVisibleBrands().map(b => b.clientId);
    return db.clients.filter(c => visibleBrandClientIds.includes(c.id));
  };

  return { isFullAccess, canEditGeneral, canEditBrand, canAccessBrand, getVisibleBrands, getVisibleClients, currentUserName, currentUserEmail };
}
