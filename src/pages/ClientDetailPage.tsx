import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { useRouter } from '../context/RouterContext';
import { ArrowLeft, User, Briefcase, Plus } from 'lucide-react';
import { formatDate } from '../lib/utils';

export function ClientDetailPage() {
  const { db, updateData, logAction } = useDatabase();
  const { route, navigate } = useRouter();
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
  
  if (route.name !== 'client') return null;
  
  const client = db.clients.find(c => c.id === route.id);
  const brands = db.brands.filter(b => b.clientId === route.id);

  const handleAddBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrand.name) return;

    const addedBrand = {
      id: `b${Date.now()}`,
      clientId: client?.id || '',
      ...newBrand
    };

    updateData('brands', [...db.brands, addedBrand]);
    logAction('Creación', `Marca: ${addedBrand.name}`, 'Directorios');
    setIsModalOpen(false);
    setNewBrand({ name: '', logo: '', website: '', accountManager: '', analysts: [], cms: [], brandStrategist: '', notes: '' });
  };
  
  if (!client) {
    return (
      <div className="p-12 text-center text-gray-500 bg-white rounded-xl shadow-sm border border-gray-200">
        Cliente no encontrado
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
          <button className="border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded-md font-medium text-sm hover:bg-gray-50 transition-colors">
            Editar Cliente
          </button>
        </div>
      </div>

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

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Marcas Asociadas ({brands.length})</h2>
          <button onClick={() => setIsModalOpen(true)} className="text-blue-600 text-sm font-medium hover:underline inline-flex items-center">
            <Plus className="w-4 h-4 mr-1" />
            Vincular Marca
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {brands.map(brand => (
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
                </div>
              </div>
              <div className="mt-2 text-xs space-y-1">
                 {am === 'Múltiples (Ver Marcas)' && brand.accountManager && <div className="text-gray-600"><span className="font-semibold">AM:</span> {brand.accountManager}</div>}
                 {analyst === 'Múltiples (Ver Marcas)' && brand.analysts && brand.analysts.length > 0 && <div className="text-gray-600"><span className="font-semibold">Analista:</span> {brand.analysts.join(', ')}</div>}
                 {cm === 'Múltiples (Ver Marcas)' && brand.cms && brand.cms.length > 0 && <div className="text-gray-600"><span className="font-semibold">CM:</span> {brand.cms.join(', ')}</div>}
                 {strategist === 'Múltiples (Ver Marcas)' && brand.brandStrategist && <div className="text-gray-600"><span className="font-semibold">Strategist:</span> {brand.brandStrategist}</div>}
              </div>
            </div>
          ))}
          {brands.length === 0 && (
            <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
               <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-3" />
               <p className="text-sm font-medium text-gray-900">Aquí se mostrarán las marcas de {client.name}</p>
               <p className="text-xs text-gray-500 mt-1">Vincula una marca desde el botón superior</p>
            </div>
          )}
        </div>
      </div>

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
    </div>
  );
}
