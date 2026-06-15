import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { useRouter } from '../context/RouterContext';
import { ArrowLeft, User, Briefcase, Plus, Building2, Globe, Link as LinkIcon, Megaphone, Shield, Smartphone } from 'lucide-react';
import { formatDate } from '../lib/utils';
import { usePermissions } from '../hooks/usePermissions';
import { supabase } from '../lib/supabase';

export function ClientDetailPage() {
  const { db, updateData, logAction } = useDatabase();
  const { route, navigate } = useRouter();
  const { isFullAccess, canEditGeneral, getVisibleBrands, getVisibleClients, getBrandOperationalRoles } = usePermissions();
  const [activeTab, setActiveTab] = useState<'resumen' | 'marcas' | 'equipo' | 'activos' | 'accesos' | 'enlaces'>('resumen');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBrand, setNewBrand] = useState({
    name: '',
    logo: '',
    website: '',
    accountManager: '',
    analysts: [] as string[],
    cms: [] as string[],
    brandStrategist: '',
    notes: ''
  });
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState({
    name: '',
    status: 'Activo' as const,
    notes: ''
  });

  if (route.name !== 'client') return null;
  
  const client = getVisibleClients().find(c => c.id === route.id);
  const brands = getVisibleBrands().filter(b => b.clientId === route.id);

  const handleEditClick = () => {
    if (!client) return;
    setEditingClient({
      name: client.name,
      status: client.status,
      notes: client.notes
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !editingClient.name) return;

    const updatedClient = {
      ...client,
      name: editingClient.name,
      status: editingClient.status,
      notes: editingClient.notes
    };

    try {
      const { error } = await supabase.from('clients').upsert([{
        id: updatedClient.id,
        name: updatedClient.name,
        status: updatedClient.status,
        date_added: updatedClient.dateAdded,
        notes: updatedClient.notes
      }]);
      if (error && error.code !== 'PGRST116') console.error('Error supabase clients upsert:', error);
    } catch (err) {
      console.error(err);
    }

    const newClients = db.clients.map(c => c.id === client.id ? updatedClient : c);
    updateData('clients', newClients);
    logAction('Edición', `Cliente: ${updatedClient.name}`, 'Directorios');
    setIsEditModalOpen(false);
  };

  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrand.name) return;

    const addedBrand = {
      id: `b${Date.now()}`,
      clientId: client?.id || '',
      ...newBrand
    };

    try {
      const { error } = await supabase.from('brands').insert([{
        id: addedBrand.id,
        client_id: addedBrand.clientId,
        name: addedBrand.name,
        logo: addedBrand.logo,
        website: addedBrand.website,
        notes: addedBrand.notes,
        account_manager: addedBrand.accountManager,
        brand_strategist: addedBrand.brandStrategist,
        analysts: addedBrand.analysts,
        cms: addedBrand.cms
      }]);
      if (error && error.code !== 'PGRST116') console.error('Error supabase brands insert:', error);
    } catch (err) {
      console.error(err);
    }

    updateData('brands', [...db.brands, addedBrand]);
    logAction('Creación', `Marca: ${addedBrand.name}`, 'Directorios');
    setIsModalOpen(false);
    setNewBrand({ name: '', logo: '', website: '', accountManager: '', analysts: [], cms: [], brandStrategist: '', notes: '' });
  };
  
  if (!client) {
    return (
      <div className="p-12 text-center text-gray-500 bg-white rounded-xl shadow-sm border border-gray-200">
        Cliente no encontrado o sin acceso
        <button onClick={() => navigate({ name: 'clients' })} className="block mx-auto mt-4 text-blue-600 hover:underline">Volver a Clientes</button>
      </div>
    );
  }

  const getUnifiedRole = (roleKey: 'accountManager' | 'brandStrategist') => {
    if (brands.length === 0) return null;
    const uniqueRoles = new Set(brands.map(b => b[roleKey]).filter(Boolean));
    return uniqueRoles.size === 1 ? Array.from(uniqueRoles)[0] : (uniqueRoles.size > 1 ? 'Múltiples (Ver Marcas)' : null);
  };

  const getUnifiedArrayRole = (roleKey: 'analysts' | 'cms') => {
    if (brands.length === 0) return null;
    const uniqueRoles = new Set(brands.flatMap(b => b[roleKey] || []).filter(Boolean));
    return uniqueRoles.size === 0 ? null : (uniqueRoles.size === 1 ? Array.from(uniqueRoles)[0] : 'Múltiples (Ver Marcas)');
  };

  const am = getUnifiedRole('accountManager');
  const analyst = getUnifiedArrayRole('analysts');
  const cm = getUnifiedArrayRole('cms');
  const strategist = getUnifiedRole('brandStrategist');
  const brandIds = brands.map((brand) => brand.id);
  const socialProfiles = db.socialProfiles.filter((profile) => brandIds.includes(profile.brandId));
  const adAccounts = db.adAccounts.filter((account) => brandIds.includes(account.brandId));
  const digitalAssets = db.digitalAssets.filter((asset) => brandIds.includes(asset.brandId));
  const brandLinks = db.brandLinks.filter((link) => brandIds.includes(link.brandId));
  const activeBrands = brands.filter((brand) => brand.name).length;
  const teamRows = brands.flatMap((brand) => [
    { brand, role: 'Ejecutiva', names: brand.accountManager ? [brand.accountManager] : [] },
    { brand, role: 'Estrategia', names: brand.brandStrategist ? [brand.brandStrategist] : [] },
    { brand, role: 'Analista', names: brand.analysts || [] },
    { brand, role: 'CM', names: brand.cms || [] },
  ]).filter((row) => row.names.length > 0);
  const tabs = [
    { id: 'resumen', label: 'Resumen', icon: Building2, count: null },
    { id: 'marcas', label: 'Marcas', icon: Briefcase, count: brands.length },
    { id: 'equipo', label: 'Equipo', icon: User, count: teamRows.length },
    { id: 'activos', label: 'Activos', icon: Globe, count: digitalAssets.length },
    { id: 'accesos', label: 'Accesos', icon: Shield, count: socialProfiles.length + adAccounts.length },
    { id: 'enlaces', label: 'Enlaces', icon: LinkIcon, count: brandLinks.length },
  ] as const;

  const findBrandName = (brandId: string) => brands.find((brand) => brand.id === brandId)?.name || 'Marca no visible';

  return (
    <div className="space-y-6">
      <div>
        <button 
          onClick={() => navigate({ name: 'clients' })}
          className="text-sm text-gray-500 hover:text-gray-900 inline-flex items-center mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Volver a Clientes
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">{client.name}</h1>
              <span className={`ml-4 px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${client.status === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {client.status}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-2 max-w-3xl">{client.notes}</p>
          </div>
          {(isFullAccess || canEditGeneral) && (
            <button onClick={handleEditClick} className="border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded-md font-medium text-sm hover:bg-gray-50 transition-colors">
              Editar Cliente
            </button>
          )}
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
                  activeTab === tab.id
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className={`w-4 h-4 mr-2 ${activeTab === tab.id ? 'text-gray-900' : 'text-gray-400'}`} />
                {tab.label}
                {tab.count !== null && (
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${activeTab === tab.id ? 'bg-gray-100 text-gray-900' : 'bg-gray-100 text-gray-500'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {activeTab === 'resumen' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-start">
          <div className="p-3 rounded-lg bg-blue-50 text-blue-600 mr-4">
            <User className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Account Manager</p>
            <p className="text-sm font-medium text-gray-900">{am || <span className="text-gray-400 italic">No definido</span>}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-start">
          <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600 mr-4">
            <User className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Analista</p>
            <p className="text-sm font-medium text-gray-900">{analyst || <span className="text-gray-400 italic">No definido</span>}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-start">
          <div className="p-3 rounded-lg bg-purple-50 text-purple-600 mr-4">
            <User className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Community Manager</p>
            <p className="text-sm font-medium text-gray-900">{cm || <span className="text-gray-400 italic">No definido</span>}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-start">
          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600 mr-4">
            <User className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Brand Strategist</p>
            <p className="text-sm font-medium text-gray-900">{strategist || <span className="text-gray-400 italic">No definido</span>}</p>
          </div>
        </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Marcas</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{activeBrands}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Activos</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{digitalAssets.length}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Redes</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{socialProfiles.length}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Ads</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{adAccounts.length}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Enlaces</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{brandLinks.length}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Alta</p>
                <p className="mt-1 text-sm font-medium text-gray-900">{formatDate(client.dateAdded)}</p>
              </div>
              <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${client.status === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {client.status}
              </span>
            </div>
            {client.notes && <p className="mt-4 text-sm leading-6 text-gray-600">{client.notes}</p>}
          </div>
      </div>
      )}

      {activeTab === 'marcas' && (
      <div className="mt-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Marcas Asociadas ({brands.length})</h2>
          {(isFullAccess || canEditGeneral) && (
            <button onClick={() => setIsModalOpen(true)} className="text-blue-600 text-sm font-medium hover:underline inline-flex items-center">
              <Plus className="w-4 h-4 mr-1" />
              Vincular Marca
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {brands.map(brand => {
            const operationalRoles = getBrandOperationalRoles(brand);
            return (
            <div
              key={brand.id}
              onClick={() => navigate({ name: 'brand', id: brand.id })}
              className="bg-white border flex flex-col p-4 rounded-lg border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer group"
            >
              <div className="flex items-center mb-3">
                <img src={brand.logo} alt={brand.name} className="w-10 h-10 rounded border border-gray-100 bg-gray-50 object-cover mr-3" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{brand.name}</p>
                  <div className="flex items-center text-xs text-gray-500 mt-0.5">
                    <Briefcase className="w-3 h-3 mr-1" /> Activos vinculados
                  </div>
                  {operationalRoles.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {operationalRoles.map((role) => (
                        <span key={role} className="inline-flex rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-700">
                          Tu rol: {role}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-2 text-xs space-y-1">
                 {am === 'Múltiples (Ver Marcas)' && brand.accountManager && <div className="text-gray-600"><span className="font-semibold">AM:</span> {brand.accountManager}</div>}
                 {analyst === 'Múltiples (Ver Marcas)' && brand.analysts && brand.analysts.length > 0 && <div className="text-gray-600"><span className="font-semibold">Analista:</span> {brand.analysts.join(', ')}</div>}
                 {cm === 'Múltiples (Ver Marcas)' && brand.cms && brand.cms.length > 0 && <div className="text-gray-600"><span className="font-semibold">CM:</span> {brand.cms.join(', ')}</div>}
                 {strategist === 'Múltiples (Ver Marcas)' && brand.brandStrategist && <div className="text-gray-600"><span className="font-semibold">Strategist:</span> {brand.brandStrategist}</div>}
              </div>
            </div>
          );
          })}
          {brands.length === 0 && (
            <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
               <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-3" />
               <p className="text-sm font-medium text-gray-900">Aquí se mostrarán las marcas de {client.name}</p>
               <p className="text-xs text-gray-500 mt-1">Vincula una marca desde el botón superior</p>
            </div>
          )}
        </div>
      </div>
      )}

      {activeTab === 'equipo' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marca</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responsable</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teamRows.map((row) => (
                row.names.map((name) => (
                  <tr key={`${row.brand.id}-${row.role}-${name}`}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      <button onClick={() => navigate({ name: 'brand', id: row.brand.id })} className="hover:text-blue-600">
                        {row.brand.name}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{row.role}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{name}</td>
                  </tr>
                ))
              ))}
              {teamRows.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-gray-500">No hay equipo asignado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'activos' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marca</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Propiedad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estatus</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {digitalAssets.map((asset) => (
                <tr key={asset.id}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                    <div className="text-xs text-gray-500">{asset.type}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{findBrandName(asset.brandId)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{asset.ownership}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">{asset.status}</span>
                  </td>
                </tr>
              ))}
              {digitalAssets.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">No hay activos digitales registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'accesos' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center">
              <Smartphone className="w-4 h-4 mr-2 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900">Redes sociales</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {socialProfiles.map((profile) => (
                <div key={profile.id} className="p-5">
                  <p className="text-sm font-medium text-gray-900">{profile.platform}</p>
                  <p className="text-xs text-gray-500">{findBrandName(profile.brandId)}</p>
                  <p className="mt-2 text-sm text-gray-600">{profile.username || profile.emailLinked || 'Sin usuario registrado'}</p>
                </div>
              ))}
              {socialProfiles.length === 0 && <div className="p-8 text-center text-sm text-gray-500">No hay redes sociales registradas.</div>}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center">
              <Megaphone className="w-4 h-4 mr-2 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900">Cuentas publicitarias</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {adAccounts.map((account) => (
                <div key={account.id} className="p-5">
                  <p className="text-sm font-medium text-gray-900">{account.platform}</p>
                  <p className="text-xs text-gray-500">{findBrandName(account.brandId)}</p>
                  <p className="mt-2 text-sm text-gray-600">{account.accountId || account.email || account.user || 'Sin identificador registrado'}</p>
                </div>
              ))}
              {adAccounts.length === 0 && <div className="p-8 text-center text-sm text-gray-500">No hay cuentas publicitarias registradas.</div>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'enlaces' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enlace</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marca</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {brandLinks.map((link) => (
                <tr key={link.id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center hover:text-blue-600">
                      {link.name}
                      <LinkIcon className="w-3 h-3 ml-1" />
                    </a>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{findBrandName(link.brandId)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{link.type}</td>
                </tr>
              ))}
              {brandLinks.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-gray-500">No hay enlaces registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-xl w-full flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Vincular Nueva Marca</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <span className="sr-only">Cerrar</span>
                ✕
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto">
              <form id="add-brand-form" onSubmit={handleAddBrand} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Marca *</label>
                  <input 
                    type="text" 
                    required
                    value={newBrand.name}
                    onChange={(e) => setNewBrand({...newBrand, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
                    placeholder="Ej. Acme Shoes"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sitio Web</label>
                    <input 
                      type="url" 
                      value={newBrand.website}
                      onChange={(e) => setNewBrand({...newBrand, website: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL del Logo</label>
                    <input 
                      type="url" 
                      value={newBrand.logo}
                      onChange={(e) => setNewBrand({...newBrand, logo: e.target.value})}
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
                        value={newBrand.accountManager}
                        onChange={(e) => setNewBrand({...newBrand, accountManager: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
                        placeholder="ej. Juan Pérez"
                      />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Brand Strategist</label>
                      <input 
                        type="text" 
                        value={newBrand.brandStrategist}
                        onChange={(e) => setNewBrand({...newBrand, brandStrategist: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
                      />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-gray-700">Analistas</label>
                        <button type="button" onClick={() => setNewBrand({...newBrand, analysts: [...newBrand.analysts, '']})} className="text-xs text-blue-600 font-medium hover:underline">+ Añadir</button>
                      </div>
                      <div className="space-y-2">
                        {newBrand.analysts.map((analyst, index) => (
                          <div key={index} className="flex gap-2">
                            <input type="text" value={analyst} onChange={(e) => {
                              const newAnalysts = [...newBrand.analysts];
                              newAnalysts[index] = e.target.value;
                              setNewBrand({...newBrand, analysts: newAnalysts});
                            }} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none" />
                            <button type="button" onClick={() => {
                              const newAnalysts = newBrand.analysts.filter((_, i) => i !== index);
                              setNewBrand({...newBrand, analysts: newAnalysts});
                            }} className="text-gray-400 hover:text-red-500 font-bold px-2">×</button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-gray-700">Community Managers</label>
                        <button type="button" onClick={() => setNewBrand({...newBrand, cms: [...newBrand.cms, '']})} className="text-xs text-blue-600 font-medium hover:underline">+ Añadir</button>
                      </div>
                      <div className="space-y-2">
                        {newBrand.cms.map((cm, index) => (
                           <div key={index} className="flex gap-2">
                             <input type="text" value={cm} onChange={(e) => {
                               const newCms = [...newBrand.cms];
                               newCms[index] = e.target.value;
                               setNewBrand({...newBrand, cms: newCms});
                             }} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none" />
                             <button type="button" onClick={() => {
                               const newCms = newBrand.cms.filter((_, i) => i !== index);
                               setNewBrand({...newBrand, cms: newCms});
                             }} className="text-gray-400 hover:text-red-500 font-bold px-2">×</button>
                           </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas u Observaciones</label>
                  <textarea 
                    value={newBrand.notes}
                    onChange={(e) => setNewBrand({...newBrand, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none min-h-[80px]"
                  />
                </div>
              </form>
            </div>
            
            <div className="p-5 border-t border-gray-100 flex justify-end space-x-3 bg-gray-50 rounded-b-xl">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                form="add-brand-form"
                className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
              >
                Vincular
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Client Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-xl w-full flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Editar Cliente</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <span className="sr-only">Cerrar</span>
                ✕
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto">
              <form id="edit-client-form" onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Cliente *</label>
                  <input 
                    type="text" 
                    required
                    value={editingClient.name}
                    onChange={(e) => setEditingClient({...editingClient, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estatus</label>
                    <select 
                      value={editingClient.status}
                      onChange={(e) => setEditingClient({...editingClient, status: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="Activo">Activo</option>
                      <option value="Inactivo">Inactivo</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas u Observaciones</label>
                  <textarea 
                    value={editingClient.notes}
                    onChange={(e) => setEditingClient({...editingClient, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none min-h-[80px]"
                  />
                </div>
              </form>
            </div>
            
            <div className="p-5 border-t border-gray-100 flex justify-end space-x-3 bg-gray-50 rounded-b-xl">
              <button 
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                form="edit-client-form"
                className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
