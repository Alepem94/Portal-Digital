import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { useRouter } from '../context/RouterContext';
import { ArrowLeft, ExternalLink, ShieldAlert, Eye, EyeOff, LayoutDashboard, FileText, Smartphone, Megaphone, Globe, MoreHorizontal } from 'lucide-react';
import { formatDate } from '../lib/utils';

export function BrandDetailPage() {
  const { db, updateData, logAction } = useDatabase();
  const { route, navigate } = useRouter();
  const [activeTab, setActiveTab] = useState<'redes' | 'ads' | 'reportes' | 'activos'>('redes');
  const [showPasswordFor, setShowPasswordFor] = useState<string | null>(null);
  const [isEditingBrand, setIsEditingBrand] = useState(false);
  const [editingBrandData, setEditingBrandData] = useState<any>(null);

  if (route.name !== 'brand') return null;
  
  const brand = db.brands.find(b => b.id === route.id);
  if (!brand) return <div>Marca no encontrada</div>;

  const client = db.clients.find(c => c.id === brand.clientId);

  const handleEditClick = () => {
    setEditingBrandData({ ...brand });
    setIsEditingBrand(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrandData.name) return;

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

  const instagramAccounts = db.instagram.filter(i => i.brandId === brand.id);
  const tiktokAccounts = db.tiktok.filter(i => i.brandId === brand.id);
  const facebookPages = db.facebookPages.filter(i => i.brandId === brand.id);
  
  const digitalAssets = db.digitalAssets.filter(i => i.brandId === brand.id);
  const brandLinks = db.brandLinks.filter(i => i.brandId === brand.id);

  const metaBusiness = db.metaBusiness.filter(i => i.brandId === brand.id);
  const metaAds = db.metaAds.filter(i => i.brandId === brand.id);
  const tiktokBusiness = db.tiktokBusiness.filter(i => i.brandId === brand.id);
  const tiktokAds = db.tiktokAds.filter(i => i.brandId === brand.id);
  const googleAds = db.googleAds.filter(i => i.brandId === brand.id);

  const adsCount = metaBusiness.length + metaAds.length + tiktokBusiness.length + tiktokAds.length + googleAds.length;
  const redesCount = instagramAccounts.length + tiktokAccounts.length + facebookPages.length;

  const tabs = [
    { id: 'redes', label: 'Redes Sociales', icon: Smartphone, count: redesCount },
    { id: 'ads', label: 'Cuentas Publicitarias', icon: Megaphone, count: adsCount },
    { id: 'reportes', label: 'Reportes y Estrategia', icon: FileText, count: brandLinks.length },
    { id: 'activos', label: 'Activos Digitales', icon: Globe, count: digitalAssets.length },
  ] as const;

  const [isAddingAcc, setIsAddingAcc] = useState(false);
  const [editingAccId, setEditingAccId] = useState<string | null>(null);
  const [addingAccType, setAddingAccType] = useState('metaBusiness');
  const [newAccData, setNewAccData] = useState<any>({ user: '', email: '', accessLevel: 'Analista', notes: '' });

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const targetTable = addingAccType as keyof typeof db;
    
    if (editingAccId) {
      updateData(targetTable, (db[targetTable] as any[]).map(item => item.id === editingAccId ? newAccData : item));
      logAction('Modificación', `Editado ${addingAccType}`, 'Cuentas Publicitarias');
    } else {
      const id = `acc_${Date.now()}`;
      updateData(targetTable, [...(db[targetTable] as any[]), { id, brandId: brand.id, ...newAccData }]);
      logAction('Creación', `Nuevo acceso a ${addingAccType}`, 'Cuentas Publicitarias');
    }
    
    setIsAddingAcc(false);
    setEditingAccId(null);
    setNewAccData({ user: '', email: '', accessLevel: 'Analista', notes: '' });
  };
  
  const openEditModal = (type: string, acc: any) => {
    setAddingAccType(type);
    setNewAccData({ ...acc });
    setEditingAccId(acc.id);
    setIsAddingAcc(true);
  };
  
  const handleDeleteAccount = (type: string, id: string) => {
    if (window.confirm('¿Seguro que deseas eliminar este registro?')) {
       const targetTable = type as keyof typeof db;
       updateData(targetTable, (db[targetTable] as any[]).filter(item => item.id !== id));
       logAction('Eliminación', `Eliminado de ${type}`, 'Cuentas Publicitarias');
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
          
          <button onClick={handleEditClick} className="bg-white border border-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium text-sm hover:bg-gray-50 shadow-sm transition-colors flex items-center">
             Configurar Marca
          </button>
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
                <button onClick={() => { setAddingAccType('instagram'); setIsAddingAcc(true); }} className="text-sm text-blue-600 font-medium hover:text-blue-800 transition-colors bg-white px-3 py-1.5 border border-gray-200 rounded-lg shadow-sm">+ Añadir perfil social</button>
              </div>
              
              {instagramAccounts.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {instagramAccounts.map(ig => (
                    <div key={ig.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-5">
                        <div className="flex items-center">
                           <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 flex items-center justify-center text-white mr-3 shadow-inner">
                             <Smartphone className="w-5 h-5" />
                           </div>
                           <div>
                            <h4 className="font-bold text-gray-900 tracking-tight text-lg leading-tight">{ig.username}</h4>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Instagram</span>
                           </div>
                        </div>
                        <div className="flex space-x-2">
                           <button onClick={() => openEditModal('instagram', ig)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Editar</button>
                           <button onClick={() => handleDeleteAccount('instagram', ig.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Eliminar</button>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-100">
                           <div>
                              <span className="block text-xs font-medium text-gray-500 mb-1">Email / Usuario login</span>
                              <div className="text-sm font-medium text-gray-900">{ig.emailLinked}</div>
                           </div>
                           <div>
                              <span className="block text-xs font-medium text-gray-500 mb-1">Verificación (MFA)</span>
                              <div className="text-sm font-medium text-gray-900 inline-flex items-center px-2 py-0.5 bg-gray-100 rounded">
                                {ig.mfaMethod}
                              </div>
                           </div>
                        </div>

                        <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div>
                               <span className="block text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-1">Contraseña de acceso</span>
                               <div className="font-mono text-sm text-gray-800">
                                 {showPasswordFor === ig.id ? ig.password : '••••••••••••••••'}
                               </div>
                            </div>
                            <button 
                              onClick={() => showPasswordFor === ig.id ? setShowPasswordFor(null) : handleRevealPassword(ig.id, 'Instagram')}
                              className={`p-2 rounded-lg transition-colors border ${showPasswordFor === ig.id ? 'bg-white border-gray-300 text-gray-900 shadow-sm' : 'bg-transparent border-transparent text-gray-400 hover:text-gray-900 hover:bg-gray-200'}`}
                            >
                              {showPasswordFor === ig.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          
                          {ig.mfaMethod === 'Google Authenticator' && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                               <span className="block text-[10px] flex items-center uppercase font-bold tracking-wider text-gray-500 mb-1.5">
                                 <ShieldAlert className="w-3 h-3 mr-1 text-amber-500" /> Códigos de Respaldo P/Uso
                               </span>
                               <div className="flex gap-2 flex-wrap">
                                 {db.mfaCodes.filter(m => m.accountId === ig.id).map(mfa => (
                                   <span key={mfa.id} className={`font-mono text-xs px-2 py-1 rounded border ${mfa.status === 'Disponible' ? 'bg-white border-gray-300 text-gray-800 cursor-pointer hover:border-gray-500' : 'bg-gray-100 border-gray-200 text-gray-400 line-through'}`} title={mfa.status === 'Disponible' ? 'Marcar como usado' : `Usado por ${mfa.usedBy}`}>
                                     {mfa.code}
                                   </span>
                                 ))}
                               </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                   <Smartphone className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                   <h3 className="text-sm font-medium text-gray-900">Sin cuentas sociales</h3>
                   <p className="text-sm text-gray-500 mt-1">Empieza agregando perfiles de Instagram, Facebook, TikTok, etc.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'ads' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-gray-900">Accesos a Plataformas Publicitarias</h3>
                <button onClick={() => { setAddingAccType('metaBusiness'); setIsAddingAcc(true); }} className="text-sm text-blue-600 font-medium hover:text-blue-800 transition-colors bg-white px-3 py-1.5 border border-gray-200 rounded-lg shadow-sm">+ Añadir acceso</button>
              </div>

              {adsCount === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                   <Megaphone className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                   <h3 className="text-sm font-medium text-gray-900">Sin cuentas publicitarias asignadas</h3>
                   <p className="text-sm text-gray-500 mt-1">Configura accesos a Meta Ads, Google Ads o TikTok Business.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Meta Business Suite */}
                  {metaBusiness.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                      <div className="bg-slate-50 px-5 py-3 border-b border-gray-200 flex justify-between items-center">
                        <h4 className="font-semibold text-slate-800">Meta Business Suite</h4>
                      </div>
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Usuario</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nivel de Acceso</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                            <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {metaBusiness.map(acc => (
                            <tr key={acc.id} className="hover:bg-gray-50">
                              <td className="px-5 py-3 text-sm font-medium text-gray-900">{acc.user}</td>
                              <td className="px-5 py-3 text-sm text-gray-600"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">{acc.accessLevel}</span></td>
                              <td className="px-5 py-3 text-sm text-gray-500">{acc.email}</td>
                              <td className="px-5 py-3 text-sm text-right space-x-2">
                                <button onClick={() => openEditModal('metaBusiness', acc)} className="text-blue-600 hover:text-blue-800 font-medium">Editar</button>
                                <button onClick={() => handleDeleteAccount('metaBusiness', acc.id)} className="text-red-600 hover:text-red-800 font-medium">Eliminar</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Meta Ads Manager */}
                  {metaAds.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                      <div className="bg-slate-50 px-5 py-3 border-b border-gray-200 flex justify-between items-center">
                        <h4 className="font-semibold text-slate-800">Meta Ads Manager</h4>
                      </div>
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Usuario</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nivel de Acceso</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {metaAds.map(acc => (
                            <tr key={acc.id} className="hover:bg-gray-50">
                              <td className="px-5 py-3 text-sm font-medium text-gray-900">{acc.user}</td>
                              <td className="px-5 py-3 text-sm text-gray-600"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">{acc.accessLevel}</span></td>
                              <td className="px-5 py-3 text-sm text-gray-500">{acc.email}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* TikTok Ads */}
                  {tiktokAds.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                      <div className="bg-slate-50 px-5 py-3 border-b border-gray-200 flex justify-between items-center">
                        <h4 className="font-semibold text-slate-800">TikTok Ads</h4>
                      </div>
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Usuario</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nivel de Acceso</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {tiktokAds.map(acc => (
                            <tr key={acc.id} className="hover:bg-gray-50">
                              <td className="px-5 py-3 text-sm font-medium text-gray-900">{acc.user}</td>
                              <td className="px-5 py-3 text-sm text-gray-600"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-pink-50 text-pink-700 border border-pink-200">{acc.accessLevel}</span></td>
                              <td className="px-5 py-3 text-sm text-gray-500">{acc.email}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  
                  {/* Google Ads */}
                  {googleAds.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                      <div className="bg-slate-50 px-5 py-3 border-b border-gray-200 flex justify-between items-center">
                        <h4 className="font-semibold text-slate-800">Google Ads</h4>
                      </div>
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">ID de Cuenta</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nivel de Acceso</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {googleAds.map(acc => (
                            <tr key={acc.id} className="hover:bg-gray-50">
                              <td className="px-5 py-3 text-sm font-medium text-gray-900">{acc.accountId}</td>
                              <td className="px-5 py-3 text-sm text-gray-500">{acc.email}</td>
                              <td className="px-5 py-3 text-sm text-gray-600"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">{acc.accessLevel}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'reportes' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
               <div className="flex justify-between items-center mb-2">
                 <h3 className="text-lg font-semibold text-gray-900">Reportes y Estrategia</h3>
                 <button onClick={() => { setAddingAccType('brandLinks'); setIsAddingAcc(true); }} className="text-sm text-blue-600 font-medium hover:text-blue-800 transition-colors bg-white px-3 py-1.5 border border-gray-200 rounded-lg shadow-sm">+ Añadir enlace</button>
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
                <button onClick={() => { setAddingAccType('digitalAssets'); setIsAddingAcc(true); }} className="text-sm text-blue-600 font-medium hover:text-blue-800 transition-colors bg-white px-3 py-1.5 border border-gray-200 rounded-lg shadow-sm">+ Añadir activo</button>
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
                        <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
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
                          <td className="px-5 py-4 text-right space-x-2">
                             <button onClick={() => openEditModal('digitalAssets', asset)} className="text-blue-600 hover:text-blue-800 font-medium text-xs">Editar</button>
                             <button onClick={() => handleDeleteAccount('digitalAssets', asset.id)} className="text-red-600 hover:text-red-800 font-medium text-xs">Eliminar</button>
                          </td>
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

              {['instagram', 'tiktok'].includes(addingAccType) && (
                <>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Usuario (@)</label><input type="text" required value={newAccData.username || ''} onChange={e => setNewAccData({...newAccData, username: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="@usuario" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Password</label><input type="text" value={newAccData.password || ''} onChange={e => setNewAccData({...newAccData, password: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Email Linked</label><input type="email" value={newAccData.emailLinked || ''} onChange={e => setNewAccData({...newAccData, emailLinked: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone Linked</label><input type="text" value={newAccData.phoneLinked || ''} onChange={e => setNewAccData({...newAccData, phoneLinked: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                  </div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">MFA Method</label><input type="text" value={newAccData.mfaMethod || ''} onChange={e => setNewAccData({...newAccData, mfaMethod: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="Google Auth, SMS..." /></div>
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

