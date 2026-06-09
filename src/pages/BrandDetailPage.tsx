import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { useRouter } from '../context/RouterContext';
import { ArrowLeft, ExternalLink, Link as LinkIcon, Lock, ChevronDown, ChevronRight, Eye, EyeOff, LayoutDashboard, Settings, UserPlus, FileText, Share2, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDate } from '../lib/utils';

function Accordion({ title, icon: Icon, children, count }: { title: string, icon: any, children: React.ReactNode, count?: number }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden mb-4 shadow-sm">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between bg-white hover:bg-gray-50 text-left transition-colors"
      >
        <div className="flex items-center">
          <Icon className="w-5 h-5 text-gray-400 mr-3 shrink-0" />
          <span className="font-semibold text-gray-900 text-sm">{title}</span>
          {count !== undefined && (
            <span className="ml-3 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs font-medium">
              {count}
            </span>
          )}
        </div>
        <div className="text-gray-400">
          {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </div>
      </button>
      {isOpen && (
        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">
          {children}
        </div>
      )}
    </div>
  );
}

export function BrandDetailPage() {
  const { db, logAction } = useDatabase();
  const { route, navigate } = useRouter();
  const [showPasswordFor, setShowPasswordFor] = useState<string | null>(null);
  
  if (route.name !== 'brand') return null;
  
  const brand = db.brands.find(b => b.id === route.id);
  if (!brand) return <div>Marca no encontrada</div>;

  const client = db.clients.find(c => c.id === brand.clientId);
  
  const handleRevealPassword = (accountId: string, platform: string) => {
    setShowPasswordFor(accountId);
    logAction('Visualización contraseña', `ID: ${accountId} (${platform})`, 'Marcas');
    setTimeout(() => {
      setShowPasswordFor(curr => curr === accountId ? null : curr);
    }, 10000);
  };

  const instagramAccounts = db.instagram.filter(i => i.brandId === brand.id);
  const digitalAssets = db.digitalAssets.filter(i => i.brandId === brand.id);
  const brandLinks = db.brandLinks.filter(i => i.brandId === brand.id);

  return (
    <div className="space-y-6 pb-20">
      <div>
        <button 
          onClick={() => navigate({ name: 'brands' })}
          className="text-sm text-gray-500 hover:text-gray-900 inline-flex items-center mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Volver a Marcas
        </button>
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-center">
            <img src={brand.logo} alt={brand.name} className="w-16 h-16 rounded-xl border border-gray-200 bg-white object-cover shadow-sm mr-5" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">{brand.name}</h1>
              <p className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors cursor-pointer mt-1 flex items-center" onClick={() => navigate({ name: 'client', id: client?.id || ''})}>
                {client?.name}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {brand.website && (
              <a href={brand.website} target="_blank" rel="noopener noreferrer" className="border border-gray-300 bg-white text-gray-700 px-3 py-2 rounded-md font-medium text-sm hover:bg-gray-50 transition-colors inline-flex items-center">
                <ExternalLink className="w-4 h-4 mr-2 text-gray-400" />
                Sitio Web
              </a>
            )}
            <button className="bg-gray-900 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-gray-800 transition-colors">
              Configuración
            </button>
          </div>
        </div>
      </div>

      {brand.notes && (
        <div className="bg-blue-50 border border-blue-100 text-blue-800 text-sm p-4 rounded-xl">
          {brand.notes}
        </div>
      )}

      {brandLinks.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-4">
          {brandLinks.map(link => (
            <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium px-3 py-1.5 rounded-full transition-colors">
              {link.type === 'Dashboard' && <LayoutDashboard className="w-3 h-3 mr-1.5 text-blue-600" />}
              {link.type === 'Archivo Estrategia' && <FileText className="w-3 h-3 mr-1.5 text-purple-600" />}
              {link.name}
            </a>
          ))}
        </div>
      )}

      <div className="mt-8">
        <Accordion title="Instagram" icon={Share2} count={instagramAccounts.length}>
          {instagramAccounts.length > 0 ? (
            <div className="space-y-4">
              {instagramAccounts.map(ig => (
                <div key={ig.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">{ig.username}</h4>
                      <div className="flex gap-3 text-xs text-gray-500 mt-1">
                        <span>Vinculado: {ig.emailLinked}</span>
                        <span>MFA: <span className="font-medium px-1.5 py-0.5 bg-gray-100 rounded text-gray-700">{ig.mfaMethod}</span></span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 border border-gray-100 rounded-lg p-3">
                    <div>
                      <span className="block text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-1">Contraseña</span>
                      <div className="flex items-center">
                        <div className="font-mono text-sm bg-white border border-gray-200 px-3 py-1.5 rounded text-gray-800 select-all flex-1 text-center">
                          {showPasswordFor === ig.id ? ig.password : '••••••••••••'}
                        </div>
                        <button 
                          onClick={() => showPasswordFor === ig.id ? setShowPasswordFor(null) : handleRevealPassword(ig.id, 'Instagram')}
                          className="ml-2 p-1.5 text-gray-500 hover:text-gray-900 border border-gray-200 bg-white hover:bg-gray-50 rounded transition-colors"
                        >
                          {showPasswordFor === ig.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1 flex justify-end">Modificada: {formatDate(ig.passwordDate)}</div>
                    </div>
                    
                    {ig.mfaMethod === 'Google Authenticator' && (
                      <div className="border-l border-gray-200 pl-4">
                         <span className="block text-[10px] flex items-center uppercase font-bold tracking-wider text-gray-500 mb-1">
                           <ShieldAlert className="w-3 h-3 mr-1 text-amber-500" /> Códigos de Respaldo MFA
                         </span>
                         <div className="flex gap-2 flex-wrap">
                           {db.mfaCodes.filter(m => m.accountId === ig.id).map(mfa => (
                             <span key={mfa.id} className={`font-mono text-xs px-2 py-1 rounded border ${mfa.status === 'Disponible' ? 'bg-white border-gray-300 text-gray-800' : 'bg-gray-100 border-gray-200 text-gray-400 line-through'}`}>
                               {mfa.code}
                             </span>
                           ))}
                         </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 py-4 text-center">No hay cuentas de Instagram registradas para esta marca.</p>
          )}
        </Accordion>

        <Accordion title="Meta Business" icon={UserPlus} count={0}>
          <p className="text-sm text-gray-500 py-4 text-center">No hay accesos de Meta Business registrados.</p>
        </Accordion>
        
        <Accordion title="TikTok Ads & Business Center" icon={LayoutDashboard} count={0}>
          <p className="text-sm text-gray-500 py-4 text-center">No hay accesos registrados.</p>
        </Accordion>

        <Accordion title="Activos Digitales (Dominios, Hosting, Analytics)" icon={LinkIcon} count={digitalAssets.length}>
          {digitalAssets.length > 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activo / URL</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Propiedad</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {digitalAssets.map(asset => (
                    <tr key={asset.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                        <a href={asset.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center mt-0.5">
                          {asset.url.replace(/^https?:\/\//, '')} <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{asset.type}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${asset.status === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {asset.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{asset.ownership}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500 py-4 text-center">No hay activos digitales registrados.</p>
          )}
        </Accordion>
      </div>
    </div>
  );
}
