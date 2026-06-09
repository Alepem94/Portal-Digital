import React from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { useRouter } from '../context/RouterContext';
import { ArrowLeft, User, Briefcase, Plus } from 'lucide-react';
import { formatDate } from '../lib/utils';

export function ClientDetailPage() {
  const { db } = useDatabase();
  const { route, navigate } = useRouter();
  
  if (route.name !== 'client') return null;
  
  const client = db.clients.find(c => c.id === route.id);
  const brands = db.brands.filter(b => b.clientId === route.id);
  
  if (!client) {
    return (
      <div className="p-12 text-center text-gray-500 bg-white rounded-xl shadow-sm border border-gray-200">
        Cliente no encontrado
        <button onClick={() => navigate({ name: 'clients' })} className="block mx-auto mt-4 text-blue-600 hover:underline">Volver a Clientes</button>
      </div>
    );
  }

  const getUnifiedRole = (roleKey: 'accountManager' | 'analyst' | 'cm' | 'brandStrategist') => {
    if (brands.length === 0) return null;
    const uniqueRoles = new Set(brands.map(b => b[roleKey]).filter(Boolean));
    return uniqueRoles.size === 1 ? Array.from(uniqueRoles)[0] : (uniqueRoles.size > 1 ? 'Múltiples (Ver Marcas)' : null);
  };

  const am = getUnifiedRole('accountManager');
  const analyst = getUnifiedRole('analyst');
  const cm = getUnifiedRole('cm');
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
          <button className="text-blue-600 text-sm font-medium hover:underline inline-flex items-center">
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
                 {analyst === 'Múltiples (Ver Marcas)' && brand.analyst && <div className="text-gray-600"><span className="font-semibold">Analista:</span> {brand.analyst}</div>}
                 {cm === 'Múltiples (Ver Marcas)' && brand.cm && <div className="text-gray-600"><span className="font-semibold">CM:</span> {brand.cm}</div>}
                 {strategist === 'Múltiples (Ver Marcas)' && brand.brandStrategist && <div className="text-gray-600"><span className="font-semibold">Strategist:</span> {brand.brandStrategist}</div>}
              </div>
            </div>
          ))}
          {brands.length === 0 && (
            <div className="col-span-full py-8 text-center text-sm text-gray-500 border-2 border-dashed border-gray-200 rounded-xl">
              Este cliente no tiene marcas asociadas.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
