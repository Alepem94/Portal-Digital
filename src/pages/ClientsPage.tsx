import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { useRouter } from '../context/RouterContext';
import { Plus, Building2, ChevronRight, User, X } from 'lucide-react';
import { formatDate } from '../lib/utils';
import { Client } from '../types';
import { usePermissions } from '../hooks/usePermissions';
import { supabase } from '../lib/supabase';

export function ClientsPage() {
  const { db, updateData, logAction } = useDatabase();
  const { navigate } = useRouter();
  const { getVisibleClients, getVisibleBrands, getBrandOperationalRoles, isFullAccess, canEditGeneral } = usePermissions();
  
  const visibleClients = getVisibleClients();
  const visibleBrands = getVisibleBrands();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    status: 'Activo' as const,
    notes: ''
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.name) return;

    const addedClient: Client = {
      ...newClient,
      id: Math.random().toString(36).substr(2, 9),
      dateAdded: new Date().toISOString()
    };

    try {
      const { error } = await supabase.from('clients').insert([{
        id: addedClient.id,
        name: addedClient.name,
        status: addedClient.status,
        date_added: addedClient.dateAdded,
        notes: addedClient.notes
      }]);
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error supabase clients insert:', error);
        alert(`Error al guardar en Supabase: ${error.message} - Posible problema con RLS.`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Error al guardar en Supabase: ${err.message || err} - Posible problema con RLS.`);
    }

    updateData('clients', [...db.clients, addedClient]);
    logAction('Creación', `Cliente: ${addedClient.name}`, 'Directorio Clientes');
    setIsModalOpen(false);
    setNewClient({ name: '', status: 'Activo', notes: '' });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Directorio de Clientes</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión de cuentas principales de la agencia.</p>
        </div>
        {(isFullAccess || canEditGeneral) && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-gray-900 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-gray-800 transition-colors inline-flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Cliente
          </button>
        )}
      </div>

      <div className="bg-white border md:rounded-xl border-gray-200 overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estatus</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responsables</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marcas</th>
              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {visibleClients.map((client) => {
              const clientBrands = visibleBrands.filter(b => b.clientId === client.id);
              const brandCount = clientBrands.length;
              
              // Helper to check if a specific role is the same across all brands
              const getUnifiedRole = (roleKey: 'accountManager' | 'brandStrategist') => {
                if (brandCount === 0) return null;
                const uniqueRoles = new Set(clientBrands.map(b => b[roleKey]).filter(Boolean));
                return uniqueRoles.size === 1 ? Array.from(uniqueRoles)[0] : (uniqueRoles.size > 1 ? 'Múltiples' : null);
              };

              const getUnifiedArrayRole = (roleKey: 'analysts' | 'cms') => {
                if (brandCount === 0) return null;
                const uniqueRoles = new Set(clientBrands.flatMap(b => b[roleKey] || []).filter(Boolean));
                return uniqueRoles.size === 0 ? null : (uniqueRoles.size === 1 ? Array.from(uniqueRoles)[0] : 'Múltiples');
              };

              const am = getUnifiedRole('accountManager');
              const analyst = getUnifiedArrayRole('analysts');
              const operationalRoles = Array.from(new Set(clientBrands.flatMap((brand) => getBrandOperationalRoles(brand))));

              return (
                <tr 
                  key={client.id} 
                  className="hover:bg-gray-50 transition-colors cursor-pointer group"
                  onClick={() => navigate({ name: 'client', id: client.id })}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{client.name}</div>
                        <div className="text-xs text-gray-500">Alta: {formatDate(client.dateAdded)}</div>
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
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${client.status === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {am ? (
                      <div className="text-sm text-gray-900 flex items-center"><User className="w-3 h-3 mr-1 text-gray-400"/> {am}</div>
                    ) : (
                      <div className="text-sm text-gray-500 italic">No definido</div>
                    )}
                    {analyst && analyst !== 'Múltiples' && <div className="text-xs text-gray-500">{analyst} (Analista)</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="inline-flex items-center py-0.5 px-2.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-800">
                      {brandCount} marcas
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="text-gray-400 group-hover:text-gray-900 transition-colors">
                      <ChevronRight className="w-5 h-5 ml-auto" />
                    </div>
                  </td>
                </tr>
              );
            })}
            {visibleClients.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No hay clientes registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Nuevo Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-xl w-full flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Agregar Nuevo Cliente</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto">
              <form id="new-client-form" onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Cliente *</label>
                  <input 
                    type="text" 
                    required
                    value={newClient.name}
                    onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ej. Acme Corp"
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estatus</label>
                    <select 
                      value={newClient.status}
                      onChange={(e) => setNewClient({...newClient, status: e.target.value as any})}
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
                    value={newClient.notes}
                    onChange={(e) => setNewClient({...newClient, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none min-h-[80px]"
                    placeholder="Detalles sobre facturación, scope of work, etc."
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
                form="new-client-form"
                className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
              >
                Guardar Cliente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
