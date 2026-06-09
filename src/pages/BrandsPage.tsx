import React from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { useRouter } from '../context/RouterContext';
import { Plus, ChevronRight, Briefcase, ExternalLink } from 'lucide-react';

export function BrandsPage() {
  const { db } = useDatabase();
  const { navigate } = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Directorio de Marcas</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión de marcas y activos digitales por cliente.</p>
        </div>
        <button className="bg-gray-900 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-gray-800 transition-colors inline-flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Marca
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {db.brands.map((brand) => {
          const client = db.clients.find(c => c.id === brand.clientId);
          const assetsCount = db.digitalAssets.filter(a => a.brandId === brand.id).length;
          const socialLinkedCount = [
            ...db.instagram.filter(i => i.brandId === brand.id),
            ...db.metaBusiness.filter(m => m.brandId === brand.id),
            ...db.tiktok.filter(t => t.brandId === brand.id)
          ].length;
          
          return (
            <div 
              key={brand.id}
              onClick={() => navigate({ name: 'brand', id: brand.id })}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer group flex flex-col h-full relative"
            >
              <div className="flex items-start justify-between mb-4">
                <img 
                  src={brand.logo} 
                  alt={brand.name} 
                  className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 object-cover"
                />
                <button className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">{brand.name}</h3>
                <p className="text-sm text-gray-500 mb-2">{client?.name || 'Cliente desconocido'}</p>
                
                {brand.website && (
                  <a 
                    href={brand.website} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    onClick={e => e.stopPropagation()}
                    className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 hover:underline mb-4"
                  >
                    {brand.website.replace(/^https?:\/\//, '')}
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <div className="flex space-x-3">
                  <span className="flex items-center bg-gray-50 px-2 py-1 rounded">
                    <Briefcase className="w-3 h-3 mr-1 text-gray-400" />
                    {assetsCount} activos
                  </span>
                  <span className="flex items-center bg-gray-50 px-2 py-1 rounded">
                    {socialLinkedCount} redes
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
