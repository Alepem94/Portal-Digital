import { useAuth } from '../context/AuthContext';
import { useDatabase } from '../context/DatabaseContext';

export function usePermissions() {
  const { user, userRole } = useAuth();
  const { db } = useDatabase();

  const isFullAccess = userRole === 'Administrador' || userRole === 'Head de Medios Digitales';
  
  const currentUserObj = db.users.find(u => u.email === user?.email);
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
    const hasMetaAccess = db.metaBusiness.some(m => m.brandId === brandId && (m.email === currentUserEmail || m.user === currentUserName));
    if (hasMetaAccess) return true;
    
    const hasInstaAccess = db.instagram.some(i => i.brandId === brandId && (i.emailLinked === currentUserEmail || i.authEmail === currentUserEmail));
    if (hasInstaAccess) return true;

    const hasGenericAccess = db.tiktokBusiness.some(t => t.brandId === brandId && (t.email === currentUserEmail || t.user === currentUserName)) || 
                             db.googleAds.some(g => g.brandId === brandId && g.email === currentUserEmail);
    if (hasGenericAccess) return true;

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
