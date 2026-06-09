import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { TOTPBlock } from '../components/TOTPBlock';
import { useRouter } from '../context/RouterContext';
import { ArrowLeft, ExternalLink, ShieldAlert, Eye, EyeOff, LayoutDashboard, FileText, Smartphone, Megaphone, Globe, MoreHorizontal } from 'lucide-react';
import { formatDate } from '../lib/utils';
import { usePermissions } from '../hooks/usePermissions';
import { supabase } from '../lib/supabase';

export function BrandDetailPage() {
  const { db, updateData, logAction } = useDatabase();
  const { route, navigate } = useRouter();
  const { isFullAccess, canAccessBrand, canEditBrand } = usePermissions();
  const [activeTab, setActiveTab] = useState<'redes' | 'ads' | 'reportes' | 'activos'>('redes');
  const [showPasswordFor, setShowPasswordFor] = useState<string | null>(null);
  const [isEditingBrand, setIsEditingBrand] = useState(false);
  const [editingBrandData, setEditingBrandData] = useState<any>(null);

  if (route.name !== 'brand') return null;
  
  const brand = db.brands.find(b => b.id === route.id);
  if (!brand || !canAccessBrand(brand.id)) {
    return (
      <div className="p-12 text-center text-gray-500 bg-white rounded-xl shadow-sm border border-gray-200">
        Marca no encontrada o sin acceso
        <button onClick={() => navigate({ name: 'clients' })} className="block mx-auto mt-4 text-blue-600 hover:underline">Volver a Clientes</button>
      </div>
    );
  }

  const client = db.clients.find(c => c.id === brand.clientId);
  const canEditThisBrand = canEditBrand(brand.id);

  const handleEditClick = () => {
    setEditingBrandData({ ...brand });
    setIsEditingBrand(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrandData.name) return;

    try {
      const { error } = await supabase.from('brands').upsert([{
        id: editingBrandData.id,
        client_id: editingBrandData.clientId,
        name: editingBrandData.name,
        logo: editingBrandData.logo,
        website: editingBrandData.website,
        notes: editingBrandData.notes,
        account_manager: editingBrandData.accountManager,
        brand_strategist: editingBrandData.brandStrategist,
        analysts: editingBrandData.analysts,
        cms: editingBrandData.cms
      }]);
      if (error && error.code !== 'PGRST116') console.error('Error supabase brands upsert:', error);
    } catch (err) {
      console.error(err);
    }

    updateData('brands', db.brands.map(b => b.id === brand.id ? editingBrandData : b));
    logAction('Edición', `Marca: ${brand.name}`, 'Marcas');
    setIsEditingBrand(false);
  };
  
  const handleRevealPassword = (accountId: string, platform: string) => {
    setShowPasswordFor(accountId);
    logAction('Visualización contraseña', `ID: ${accountId} (${platform})`, 'Marcas');
    setTimeout(() => {
      setShowPasswordFor(curr => curr === accountId ? null : curr);
    }, 10000);
  };

  const socialProfiles = db.socialProfiles ? db.socialProfiles.filter(i => i.brandId === brand.id) : [];
  const adAccounts = db.adAccounts ? db.adAccounts.filter(i => i.brandId === brand.id) : [];
  const digitalAssets = db.digitalAssets.filter(i => i.brandId === brand.id);
  const brandLinks = db.brandLinks.filter(i => i.brandId === brand.id);

  const tabs = [
    { id: 'redes', label: 'Redes Sociales', icon: Smartphone, count: socialProfiles.length },
    { id: 'ads', label: 'Cuentas Publicitarias', icon: Megaphone, count: adAccounts.length },
    { id: 'reportes', label: 'Reportes y Estrategia', icon: FileText, count: brandLinks.length },
    { id: 'activos', label: 'Activos Digitales', icon: Globe, count: digitalAssets.length },
  ] as const;

  const [isAddingAcc, setIsAddingAcc] = useState(false);
  const [editingAccId, setEditingAccId] = useState<string | null>(null);
  const [addingAccType, setAddingAccType] = useState('metaBusiness');
  const [newAccData, setNewAccData] = useState<any>({ user: '', email: '', accessLevel: 'Analista', notes: '' });

  const getTableAndPlatform = (type: string) => {
    switch (type) {
      case 'instagram': return { table: 'socialProfiles', platform: 'Instagram' };
      case 'tiktok': return { table: 'socialProfiles', platform: 'TikTok' };
      case 'xAccounts': return { table: 'socialProfiles', platform: 'X (Twitter)' };
      case 'shopify': return { table: 'socialProfiles', platform: 'Shopify' };
      case 'facebookPages': return { table: 'socialProfiles', platform: 'Facebook Page' };
      case 'metaBusiness': return { table: 'adAccounts', platform: 'Meta Business' };
      case 'metaAds': return { table: 'adAccounts', platform: 'Meta Ads' };
      case 'tiktokBusiness': return { table: 'adAccounts', platform: 'TikTok Business' };
      case 'tiktokAds': return { table: 'adAccounts', platform: 'TikTok Ads' };
      case 'googleAds': return { table: 'adAccounts', platform: 'Google Ads' };
      default: return { table: type, platform: type };
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const { table: targetTable, platform } = getTableAndPlatform(addingAccType);
    let finalData;
    
    // Normalize Facebook pages
    let normalizedAccData = { ...newAccData };
    if (addingAccType === 'facebookPages' && normalizedAccData.pageName) {
      normalizedAccData.username = normalizedAccData.pageName;
    }
    
    if (editingAccId) {
      finalData = { ...normalizedAccData, id: editingAccId, platform };
      updateData(targetTable as keyof typeof db, (db[targetTable as keyof typeof db] as any[]).map(item => item.id === editingAccId ? finalData : item));
      logAction('Modificación', `Editado ${platform}`, 'Cuentas Publicitarias');
    } else {
      const id = `acc_${Date.now()}`;
      finalData = { id, brandId: brand.id, platform, ...normalizedAccData };
      updateData(targetTable as keyof typeof db, [...(db[targetTable as keyof typeof db] as any[]), finalData]);
      logAction('Creación', `Nuevo acceso a ${platform}`, 'Cuentas Publicitarias');
    }
    
    // Sincronizar hacia Supabase dependiendo del tipo
    try {
      let supabaseError = null;
      if (targetTable === 'socialProfiles') {
        const { error } = await supabase.from('social_profiles').upsert([{ 
          id: finalData.id, 
          brand_id: finalData.brandId, 
          platform: finalData.platform,
          username: finalData.username, 
          url: finalData.url,
          login_user: finalData.loginUser,
          password: finalData.password, 
          password_date: finalData.passwordDate || new Date().toISOString(),
          email_linked: finalData.emailLinked, 
          phone_linked: finalData.phoneLinked, 
          mfa_method: finalData.mfaMethod,
          notes: finalData.notes,
          totp_secret: finalData.totpSecret
        }]);
        supabaseError = error;
      } else if (targetTable === 'adAccounts') {
        const { error } = await supabase.from('ad_accounts').upsert([{ 
          id: finalData.id, 
          brand_id: finalData.brandId, 
          platform: finalData.platform,
          account_id: finalData.accountId, 
          account_user: finalData.user, 
          email: finalData.email, 
          access_level: finalData.accessLevel, 
          notes: finalData.notes 
        }]);
        supabaseError = error;
      } else if (addingAccType === 'digitalAssets') {
        const { error } = await supabase.from('digital_assets').upsert([{ id: finalData.id, brand_id: finalData.brandId, type: finalData.type, name: finalData.name, url: finalData.url, ownership: finalData.ownership, status: finalData.status, notes: finalData.notes }]);
        supabaseError = error;
      } else if (addingAccType === 'brandLinks') {
        const { error } = await supabase.from('brand_links').upsert([{ id: finalData.id, brand_id: finalData.brandId, type: finalData.type, name: finalData.name, url: finalData.url }]);
        supabaseError = error;
      }

      if (supabaseError) {
        console.error('Error de Supabase al guardar:', supabaseError.message || supabaseError);
        alert(`No se pudo guardar en la base de datos: ${supabaseError.message}`);
      }
    } catch(err) {
      console.error('Error syncing individual record', err);
    }

    setIsAddingAcc(false);
    setEditingAccId(null);
    setNewAccData({ user: '', email: '', accessLevel: 'Analista', notes: '' });
  };

  
  const openEditModal = (type: string, acc: any) => {
    setAddingAccType(type);
    const mappedAcc = { ...acc };
    if (type === 'facebookPages' && mappedAcc.username && !mappedAcc.pageName) {
       mappedAcc.pageName = mappedAcc.username;
    }
    setNewAccData(mappedAcc);
    setEditingAccId(acc.id);
    setIsAddingAcc(true);
  };
  
  const handleDeleteAccount = async (type: string, id: string) => {
    if (window.confirm('¿Seguro que deseas eliminar este registro?')) {
       const targetTable = type as keyof typeof db;
       updateData(targetTable, (db[targetTable] as any[]).filter(item => item.id !== id));
       logAction('Eliminación', `Eliminado de ${type}`, 'Cuentas Publicitarias');
       
       try {
         const dbTableMap: Record<string, string> = {
            socialProfiles: 'social_profiles',
            adAccounts: 'ad_accounts',
            digitalAssets: 'digital_assets',
            brandLinks: 'brand_links'
         };
         if (dbTableMap[type]) {
           await supabase.from(dbTableMap[type]).delete().eq('id', id);
         }
       } catch (err) {
         console.error('Error elimindando de supabase', err);
       }
    }
  };


  return (
    <div className="space-y-6 pb-20">
      {/* Encabezado */}
      <div>
        <button 
          onClick={() => navigate({ name: 'client', id: brand.clientId })}
          className="text-sm text-gray-500 hover:text-gray-900 inline-flex items-center mb-4 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Volver a Cliente ({client?.name || '...'})
        </button>
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-center">
            {brand.logo ? (
              <img src={brand.logo} alt={brand.name} className="w-20 h-20 rounded-2xl border border-gray-100 bg-white object-cover shadow-sm mr-5" />
            ) : (
              <div className="w-20 h-20 rounded-2xl border border-gray-100 bg-gray-50 flex items-center justify-center text-gray-300 mr-5">
                <Globe className="w-8 h-8" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">{brand.name}</h1>
              <div className="flex items-center mt-2 space-x-3">
                <p 
                  className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors cursor-pointer flex items-center bg-gray-100 px-3 py-1 rounded-full" 
                  onClick={() => navigate({ name: 'client', id: client?.id || ''})}
                >
                  Cliente: <span className="ml-1 text-gray-900 font-semibold">{client?.name || 'Independiente'}</span>
                </p>
                {brand.website && (
                  <a href={brand.website} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors flex items-center">
                    Sitio web <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                )}
              </div>
            </div>
          </div>
          
          {canEditThisBrand && (
            <button onClick={handleEditClick} className="bg-white border border-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium text-sm hover:bg-gray-50 shadow-sm transition-colors flex items-center">
               Configurar Marca
            </button>
          )}
        </div>
      </div>

      {brand.notes && (
        <div className="bg-gray-50 border border-gray-100 text-gray-600 text-sm p-4 rounded-xl leading-relaxed">
          {brand.notes}
        </div>
      )}

      {/* Tabs Layout */}
      <div className="mt-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-6 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors
                    ${activeTab === tab.id 
                      ? 'border-gray-900 text-gray-900' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 mr-2 ${activeTab === tab.id ? 'text-gray-900' : 'text-gray-400'}`} />
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${activeTab === tab.id ? 'bg-gray-100 text-gray-900' : 'bg-gray-100 text-gray-500'}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content Area */}
        <div className="py-6">
          {activeTab === 'redes' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-gray-900">Perfiles Sociales</h3>
                {canEditThisBrand && (
                  <button onClick={() => { setAddingAccType('instagram'); setIsAddingAcc(true); }} className="text-sm text-blue-600 font-medium hover:text-blue-800 transition-colors bg-white px-3 py-1.5 border border-gray-200 rounded-lg shadow-sm">+ Añadir perfil social</button>
                )}
              </div>
              <div className="space-y-4">
                {socialProfiles.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                    <Smartphone className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-sm font-medium text-gray-900">No hay redes sociales</h3>
                    <p className="text-sm text-gray-500 mt-1">Aún no se han configurado perfiles sociales para esta marca.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-5">
                  {socialProfiles.map(profile => (
                    <div key={profile.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-5">
                        <div className="flex items-center">
                           <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white mr-3 shadow-inner ${profile.platform === 'Instagram' ? 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500' : profile.platform === 'TikTok' ? 'bg-black' : profile.platform === 'X (Twitter)' ? 'bg-gray-900' : profile.platform === 'Shopify' ? 'bg-green-600' : 'bg-blue-600'}`}>
                             <Smartphone className="w-5 h-5" />
                           </div>
                           <div>
                            <h4 className="font-bold text-gray-900 tracking-tight text-lg leading-tight">{profile.username || 'Sin nombre'}</h4>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{profile.platform}</span>
                           </div>
                        </div>
                        <div className="flex space-x-2">
                           <button onClick={() => {
                              const pType = profile.platform === 'Instagram' ? 'instagram' : profile.platform === 'TikTok' ? 'tiktok' : profile.platform === 'X (Twitter)' ? 'xAccounts' : profile.platform === 'Shopify' ? 'shopify' : 'facebookPages';
                              openEditModal(pType, profile);
                           }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Editar">
                             <LayoutDashboard className="w-4 h-4" />
                           </button>
                           {canEditThisBrand && (
                             <button onClick={() => handleDeleteAccount('socialProfiles', profile.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Eliminar">
                               <MoreHorizontal className="w-4 h-4" />
                             </button>
                           )}
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                         {profile.platform === 'Facebook Page' && profile.url ? (
                           <div className="grid grid-cols-2 gap-4 mb-4">
                             <div className="col-span-2">
                                <span className="block text-xs font-medium text-gray-500 mb-1">URL de la Página</span>
                                <div className="text-sm font-medium text-blue-600 break-all">
                                  <a href={profile.url} target="_blank" rel="noopener noreferrer" className="hover:underline inline-flex items-center">
                                    {profile.url}
                                    <ExternalLink className="w-3 h-3 ml-1" />
                                  </a>
                                </div>
                             </div>
                           </div>
                         ) : (
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                           <div className="col-span-2 md:col-span-1">
                              <span className="block text-xs font-medium text-gray-500 mb-1">Acceso (Email / Usuario)</span>
                              <div className="text-sm font-medium text-gray-900 space-y-1">
                                <div>Usuario: {profile.username}</div>
                                {profile.loginUser && profile.loginUser !== profile.username && <div>Login Alterno: {profile.loginUser}</div>}
                                {profile.emailLinked ? <div>Email: {profile.emailLinked}</div> : <span className="text-gray-400 italic text-[11px]">Sin email registrado</span>}
                              </div>
                           </div>
                           <div className="col-span-2 md:col-span-1">
                              <span className="block text-xs font-medium text-gray-500 mb-1">Verificación (MFA)</span>
                              <div className="text-sm font-medium text-gray-900 inline-flex items-center px-2 py-0.5 bg-gray-100 rounded">
                                {profile.mfaMethod || 'Ninguno'}
                              </div>
                           </div>
                           
                           <div className="col-span-2 md:col-span-2">
                             <span className="block text-xs font-medium text-gray-500 mb-1">Contraseña</span>
                             <div className="flex items-center relative">
                               <input 
                                 type={showPasswordFor === profile.id ? 'text' : 'password'}
                                 value={profile.password || ''}
                                 readOnly
                                 className="text-sm font-mono bg-white border border-gray-200 text-gray-800 px-3 py-1.5 rounded-md w-full focus:outline-none"
                               />
                               <button 
                                 onClick={() => handleRevealPassword(profile.id, profile.platform)}
                                 className="absolute right-2 text-gray-400 hover:text-gray-600 p-1 bg-white"
                               >
                                 {showPasswordFor === profile.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                               </button>
                             </div>
                             <div className="text-[10px] text-gray-500 mt-1.5 text-right">
                               Actualizada: {profile.passwordDate ? formatDate(profile.passwordDate) : '-'}
                             </div>
                           </div>
                         </div>
                         )}
                         
                         {profile.platform !== 'Facebook Page' && (
                         <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between">
                           <div>
                             <span className="block text-xs font-medium text-gray-500 mb-1">Teléfono Vinculado</span>
                             <div className="text-sm font-medium text-gray-900">{profile.phoneLinked || '-'}</div>
                           </div>
                         </div>
                         )}
                         
                         {profile.notes && (
                           <div className="mt-4 pt-3 border-t border-gray-200">
                             <span className="block text-xs font-medium text-gray-500 mb-1">Notas</span>
                             <p className="text-sm text-gray-700 whitespace-pre-wrap">{profile.notes}</p>
                           </div>
                         )}

                         {profile.platform !== 'Facebook Page' && (
                         <div className="mt-3">
                          {['Google Authenticator', 'App Autenticadora', 'Google Auth'].includes(profile.mfaMethod || '') ? (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                               <span className="block text-[10px] flex items-center uppercase font-bold tracking-wider text-gray-500 mb-1.5">
                                 <ShieldAlert className="w-3 h-3 mr-1 text-amber-500" /> Códigos de Respaldo P/Uso
                               </span>
                               <TOTPBlock 
                                  initialSecret={profile.totpSecret} 
                                  itemId={profile.id} 
                                  table="socialProfiles" 
                                  onSecretSaved={(secret) => {
                                    const updatedProfile = { ...profile, totpSecret: secret };
                                    updateData('socialProfiles', db.socialProfiles.map(a => a.id === updatedProfile.id ? updatedProfile : a));
                                    supabase.from('social_profiles').update({ totp_secret: secret }).eq('id', profile.id).then();
                                  }} 
                               />
                            </div>
                          ) : canEditThisBrand ? (
                             <div className="mt-3 pt-3 border-t border-gray-200">
                                <div className="flex items-center justify-between bg-indigo-50/50 p-2 rounded border border-indigo-100 border-dashed">
                                  <div className="flex items-center">
                                    <ShieldAlert className="w-4 h-4 text-indigo-500 mr-2" />
                                    <span className="text-xs text-gray-600">Integrar generación 2FA</span>
                                  </div>
                                  <button
                                    onClick={async () => {
                                      const updatedProfile = { ...profile, mfaMethod: 'App Autenticadora' };
                                      updateData('socialProfiles', db.socialProfiles.map(a => a.id === updatedProfile.id ? updatedProfile : a));
                                      try {
                                        await supabase.from('social_profiles').update({ mfa_method: 'App Autenticadora' }).eq('id', profile.id);
                                      } catch(e) {}
                                    }}
                                    className="text-[10px] font-medium text-indigo-600 hover:text-indigo-800 bg-white border border-indigo-200 px-2 py-1 rounded shadow-sm transition-all"
                                  >
                                    Activar
                                  </button>
                                </div>
                             </div>
                          ) : null}
                         </div>
                         )}
                      </div>
                    </div>
                  ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {activeTab === 'ads' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-gray-900">Accesos a Plataformas Publicitarias</h3>
                {canEditThisBrand && (
                  <button onClick={() => { setAddingAccType('metaBusiness'); setIsAddingAcc(true); }} className="text-sm text-blue-600 font-medium hover:text-blue-800 transition-colors bg-white px-3 py-1.5 border border-gray-200 rounded-lg shadow-sm">+ Añadir acceso</button>
                )}
              </div>

              {adAccounts.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                   <Megaphone className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                   <h3 className="text-sm font-medium text-gray-900">Sin cuentas publicitarias asignadas</h3>
                   <p className="text-sm text-gray-500 mt-1">Configura accesos a Meta Ads, Google Ads o TikTok Business.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {['Meta Business', 'Meta Ads', 'TikTok Business', 'TikTok Ads', 'Google Ads'].map((platformGroup) => {
                     const platformAccounts = adAccounts.filter(a => a.platform === platformGroup);
                     if (platformAccounts.length === 0) return null;
                     
                     return (
                       <div key={platformGroup} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                         <div className="bg-slate-50 px-5 py-3 border-b border-gray-200 flex justify-between items-center">
                           <h4 className="font-semibold text-slate-800">{platformGroup}</h4>
                         </div>
                         <div className="overflow-x-auto">
                           <table className="min-w-full divide-y divide-gray-200">
                             <thead className="bg-gray-50">
                               <tr>
                                 {platformGroup === 'Google Ads' || platformGroup === 'Meta Ads' || platformGroup === 'TikTok Ads' ? (
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap bg-gray-50/50 sticky left-0">ID de Cuenta</th>
                                 ) : null}
                                 <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Usuario</th>
                                 <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                                 <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nivel de Acceso</th>
                                 {canEditThisBrand && <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Acciones</th>}
                               </tr>
                             </thead>
                             <tbody className="bg-white divide-y divide-gray-100">
                               {platformAccounts.map(acc => (
                                 <tr key={acc.id} className="hover:bg-gray-50 transition-colors">
                                   {platformGroup === 'Google Ads' || platformGroup === 'Meta Ads' || platformGroup === 'TikTok Ads' ? (
                                      <td className="px-5 py-3 text-sm font-medium text-gray-900 bg-white group-hover:bg-gray-50 sticky left-0 border-r border-gray-100/50">{acc.accountId || '-'}</td>
                                   ) : null}
                                   <td className="px-5 py-3 text-sm text-gray-900 break-all">{acc.user || '-'}</td>
                                   <td className="px-5 py-3 text-sm text-gray-500 break-all">{acc.email || '-'}</td>
                                   <td className="px-5 py-3 text-sm text-gray-600 whitespace-nowrap"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">{acc.accessLevel}</span></td>
                                   {canEditThisBrand && (
                                     <td className="px-5 py-3 text-sm text-right space-x-2 whitespace-nowrap">
                                       <button onClick={() => {
                                          const pType = acc.platform === 'Meta Business' ? 'metaBusiness' : acc.platform === 'Meta Ads' ? 'metaAds' : acc.platform === 'TikTok Business' ? 'tiktokBusiness' : acc.platform === 'TikTok Ads' ? 'tiktokAds' : 'googleAds';
                                          openEditModal(pType, acc);
                                       }} className="text-blue-600 hover:text-blue-800 font-medium">Editar</button>
                                       <button onClick={() => handleDeleteAccount('adAccounts', acc.id)} className="text-red-600 hover:text-red-800 font-medium">Eliminar</button>
                                     </td>
                                   )}
                                 </tr>
                               ))}
                             </tbody>
                           </table>
                         </div>
                       </div>
                     );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'reportes' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
               <div className="flex justify-between items-center mb-2">
                 <h3 className="text-lg font-semibold text-gray-900">Reportes y Estrategia</h3>
                 {canEditThisBrand && (
                   <button onClick={() => { setAddingAccType('brandLinks'); setIsAddingAcc(true); }} className="text-sm text-blue-600 font-medium hover:text-blue-800 transition-colors bg-white px-3 py-1.5 border border-gray-200 rounded-lg shadow-sm">+ Añadir enlace</button>
                 )}
               </div>
               
               {brandLinks.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {brandLinks.map(link => (
                     <a href={link.url} target="_blank" rel="noopener noreferrer" key={link.id} className="bg-white border border-gray-200 p-4 rounded-xl hover:shadow-md hover:border-gray-300 transition-all group flex flex-col h-full">
                       <div className="flex items-start justify-between mb-2">
                         <div className={`p-2 rounded-lg ${link.type === 'Dashboard' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                           {link.type === 'Dashboard' ? <LayoutDashboard className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                         </div>
                         <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-gray-500" />
                       </div>
                       <h4 className="font-semibold text-gray-900 mt-2 mb-1">{link.name}</h4>
                       <p className="text-xs text-gray-500 mt-auto">{link.type}</p>
                     </a>
                   ))}
                 </div>
               ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                   <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                   <h3 className="text-sm font-medium text-gray-900">No hay reportes ni estrategias asignadas</h3>
                   <p className="text-sm text-gray-500 mt-1">Añade enlaces directos a Data Studio, presentaciones o documentaciones.</p>
                </div>
               )}
            </div>
          )}

          {activeTab === 'activos' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-gray-900">Activos Digitales</h3>
                {canEditThisBrand && (
                  <button onClick={() => { setAddingAccType('digitalAssets'); setIsAddingAcc(true); }} className="text-sm text-blue-600 font-medium hover:text-blue-800 transition-colors bg-white px-3 py-1.5 border border-gray-200 rounded-lg shadow-sm">+ Añadir activo</button>
                )}
              </div>
              
              {digitalAssets.length > 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Activo / URL</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Propiedad</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                        {canEditThisBrand && <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {digitalAssets.map(asset => (
                        <tr key={asset.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-4">
                            <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                            <a href={asset.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center mt-0.5">
                              {asset.url.replace(/^https?:\/\//, '')} <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-600">{asset.type}</td>
                          <td className="px-5 py-4 text-sm text-gray-600">{asset.ownership}</td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${asset.status === 'Activo' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
                              {asset.status}
                            </span>
                          </td>
                          {canEditThisBrand && (
                            <td className="px-5 py-4 text-right space-x-2">
                               <button onClick={() => openEditModal('digitalAssets', asset)} className="text-blue-600 hover:text-blue-800 font-medium text-xs">Editar</button>
                               <button onClick={() => handleDeleteAccount('digitalAssets', asset.id)} className="text-red-600 hover:text-red-800 font-medium text-xs">Eliminar</button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                   <Globe className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                   <h3 className="text-sm font-medium text-gray-900">Sin activos digitales</h3>
                   <p className="text-sm text-gray-500 mt-1">Administra dominios, accesos de hosting y Google Search Console.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isEditingBrand && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-xl w-full flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Configurar Marca</h3>
              <button onClick={() => setIsEditingBrand(false)} className="text-gray-400 hover:text-gray-600">
                <span className="sr-only">Cerrar</span>
                ✕
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto">
              <form id="edit-brand-form" onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Marca</label>
                  <input 
                    type="text" 
                    required
                    value={editingBrandData.name}
                    onChange={(e) => setEditingBrandData({...editingBrandData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Sitio Web</label>
                     <input 
                       type="url" 
                       value={editingBrandData.website}
                       onChange={(e) => setEditingBrandData({...editingBrandData, website: e.target.value})}
                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
                     />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL del Logo</label>
                    <input 
                      type="url" 
                      value={editingBrandData.logo}
                      onChange={(e) => setEditingBrandData({...editingBrandData, logo: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 border-b pb-2">Equipo Asignado</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Account Manager</label>
                      <input 
                        type="text" 
                        value={editingBrandData.accountManager || ''}
                        onChange={(e) => setEditingBrandData({...editingBrandData, accountManager: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
                        placeholder="ej. Juan Pérez"
                      />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Brand Strategist</label>
                      <input 
                        type="text" 
                        value={editingBrandData.brandStrategist || ''}
                        onChange={(e) => setEditingBrandData({...editingBrandData, brandStrategist: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
                      />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-gray-700">Analistas</label>
                        <button type="button" onClick={() => setEditingBrandData({...editingBrandData, analysts: [...(editingBrandData.analysts || []), '']})} className="text-xs text-blue-600 font-medium hover:underline">+ Añadir</button>
                      </div>
                      <div className="space-y-2">
                        {(editingBrandData.analysts || []).map((analyst: string, index: number) => (
                           <div key={index} className="flex gap-2">
                             <input type="text" value={analyst} onChange={(e) => {
                               const newAnalysts = [...editingBrandData.analysts];
                               newAnalysts[index] = e.target.value;
                               setEditingBrandData({...editingBrandData, analysts: newAnalysts});
                             }} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none" />
                             <button type="button" onClick={() => {
                               const newAnalysts = editingBrandData.analysts.filter((_: string, i: number) => i !== index);
                               setEditingBrandData({...editingBrandData, analysts: newAnalysts});
                             }} className="text-gray-400 hover:text-red-500 font-bold px-2">×</button>
                           </div>
                        ))}
                        {(!editingBrandData.analysts || editingBrandData.analysts.length === 0) && (
                          <div className="text-sm text-gray-500 italic">No hay analistas añadidos.</div>
                        )}
                      </div>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-gray-700">Community Managers</label>
                        <button type="button" onClick={() => setEditingBrandData({...editingBrandData, cms: [...(editingBrandData.cms || []), '']})} className="text-xs text-blue-600 font-medium hover:underline">+ Añadir</button>
                      </div>
                      <div className="space-y-2">
                        {(editingBrandData.cms || []).map((cm: string, index: number) => (
                           <div key={index} className="flex gap-2">
                             <input type="text" value={cm} onChange={(e) => {
                               const newCms = [...editingBrandData.cms];
                               newCms[index] = e.target.value;
                               setEditingBrandData({...editingBrandData, cms: newCms});
                             }} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none" />
                             <button type="button" onClick={() => {
                               const newCms = editingBrandData.cms.filter((_: string, i: number) => i !== index);
                               setEditingBrandData({...editingBrandData, cms: newCms});
                             }} className="text-gray-400 hover:text-red-500 font-bold px-2">×</button>
                           </div>
                        ))}
                        {(!editingBrandData.cms || editingBrandData.cms.length === 0) && (
                          <div className="text-sm text-gray-500 italic">No hay CMs añadidos.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas u Observaciones</label>
                  <textarea 
                    value={editingBrandData.notes}
                    onChange={(e) => setEditingBrandData({...editingBrandData, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none min-h-[80px]"
                  />
                </div>
              </form>
            </div>
            
            <div className="p-5 border-t border-gray-100 flex justify-end space-x-3 bg-gray-50 rounded-b-xl">
              <button 
                type="button"
                onClick={() => setIsEditingBrand(false)}
                className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                form="edit-brand-form"
                className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddingAcc && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-sm w-full flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Añadir Accesos ({activeTab})</h3>
              <button onClick={() => setIsAddingAcc(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            
            <form onSubmit={handleAddAccount} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plataforma</label>
                <select 
                  value={addingAccType}
                  onChange={(e) => setAddingAccType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none bg-white"
                >
                  {activeTab === 'redes' ? (
                    <>
                      <option value="instagram">Instagram</option>
                      <option value="tiktok">TikTok</option>
                      <option value="facebookPages">Facebook Page</option>
                      <option value="xAccounts">X (Twitter)</option>
                      <option value="shopify">Shopify</option>
                    </>
                  ) : activeTab === 'ads' ? (
                    <>
                      <option value="metaBusiness">Meta Business Suite</option>
                      <option value="metaAds">Meta Ads Manager</option>
                      <option value="tiktokBusiness">TikTok Business Center</option>
                      <option value="tiktokAds">TikTok Ads Manager</option>
                      <option value="googleAds">Google Ads</option>
                    </>
                  ) : activeTab === 'activos' ? (
                    <>
                      <option value="digitalAssets">Activo Digital (Dominio/Hosting)</option>
                    </>
                  ) : (
                    <>
                      <option value="brandLinks">Reporte/Enlace</option>
                    </>
                  )}
                </select>
              </div>

              {['instagram', 'tiktok', 'shopify', 'xAccounts'].includes(addingAccType) && (
                <>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Usuario / Handle (@)</label><input type="text" required value={newAccData.username || ''} onChange={e => setNewAccData({...newAccData, username: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="@usuario" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">URL (Opcional)</label><input type="url" value={newAccData.url || ''} onChange={e => setNewAccData({...newAccData, url: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Password</label><input type="text" value={newAccData.password || ''} onChange={e => setNewAccData({...newAccData, password: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Usuario de Login</label><input type="text" value={newAccData.loginUser || ''} onChange={e => setNewAccData({...newAccData, loginUser: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="Si aplica" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Email Linked</label><input type="email" value={newAccData.emailLinked || ''} onChange={e => setNewAccData({...newAccData, emailLinked: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone Linked</label><input type="text" value={newAccData.phoneLinked || ''} onChange={e => setNewAccData({...newAccData, phoneLinked: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">MFA Method</label><input type="text" value={newAccData.mfaMethod || ''} onChange={e => setNewAccData({...newAccData, mfaMethod: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="App Autenticadora, SMS..." /></div>
                  </div>
                </>
              )}

              {addingAccType === 'facebookPages' && (
                <>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Page Name</label><input type="text" required value={newAccData.pageName || ''} onChange={e => setNewAccData({...newAccData, pageName: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Page URL</label><input type="url" required value={newAccData.url || ''} onChange={e => setNewAccData({...newAccData, url: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Page ID</label><input type="text" value={newAccData.pageId || ''} onChange={e => setNewAccData({...newAccData, pageId: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                </>
              )}

              {['metaBusiness', 'metaAds', 'tiktokBusiness', 'tiktokAds', 'googleAds'].includes(addingAccType) && (
                <>
                  {addingAccType === 'googleAds' ? (
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">ID de Cuenta</label><input type="text" required value={newAccData.accountId || ''} onChange={e => setNewAccData({...newAccData, accountId: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="123-456-7890" /></div>
                  ) : (
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label><input type="text" required value={newAccData.user || ''} onChange={e => setNewAccData({...newAccData, user: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="Nombre completo" /></div>
                  )}
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Email Vinculado</label><input type="email" required value={newAccData.email || ''} onChange={e => setNewAccData({...newAccData, email: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Nivel de Acceso</label><input type="text" required value={newAccData.accessLevel || ''} onChange={e => setNewAccData({...newAccData, accessLevel: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="Administrador, Analista..." /></div>
                </>
              )}

              {addingAccType === 'digitalAssets' && (
                <>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label><input type="text" required value={newAccData.name || ''} onChange={e => setNewAccData({...newAccData, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                    <select required value={newAccData.type || 'Dominio'} onChange={e => setNewAccData({...newAccData, type: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                      <option value="Dominio">Dominio</option>
                      <option value="Hosting">Hosting</option>
                      <option value="Meta Business">Meta Business</option>
                      <option value="Google Ads">Google Ads</option>
                    </select>
                  </div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">URL</label><input type="url" value={newAccData.url || ''} onChange={e => setNewAccData({...newAccData, url: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Propiedad</label>
                    <select required value={newAccData.ownership || 'Cliente'} onChange={e => setNewAccData({...newAccData, ownership: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                      <option value="Cliente">Cliente</option>
                      <option value="Agencia">Agencia</option>
                    </select>
                  </div>
                </>
              )}

              {addingAccType === 'brandLinks' && (
                <>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label><input type="text" required value={newAccData.name || ''} onChange={e => setNewAccData({...newAccData, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">URL</label><input type="url" required value={newAccData.url || ''} onChange={e => setNewAccData({...newAccData, url: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                    <select required value={newAccData.type || 'Dashboard'} onChange={e => setNewAccData({...newAccData, type: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                      <option value="Dashboard">Dashboard</option>
                      <option value="Archivo Estrategia">Archivo Estrategia</option>
                      <option value="Drive">Drive</option>
                    </select>
                  </div>
                </>
              )}

              <div className="pt-2 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsAddingAcc(false)} className="px-4 py-2 border text-sm border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-slate-900 text-sm text-white rounded-lg font-medium hover:bg-slate-800">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

