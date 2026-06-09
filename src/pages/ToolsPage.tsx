import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { Wrench, Eye, EyeOff, Plus, Search, HelpCircle } from 'lucide-react';
import { formatDate } from '../lib/utils';

export function ToolsPage() {
  const { db, logAction } = useDatabase();
  const [showPasswordFor, setShowPasswordFor] = useState<string | null>(null);

  const handleRevealPassword = (toolId: string) => {
    setShowPasswordFor(toolId);
    logAction('Visualización contraseña', `ID herramienta compartida: ${toolId}`, 'Herramientas');
    // Hide password after 10 seconds for security
    setTimeout(() => {
      setShowPasswordFor(curr => curr === toolId ? null : curr);
    }, 10000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Herramientas Compartidas</h1>
          <p className="text-sm text-gray-500 mt-1">Catálogo de accesos y software compartido de la agencia.</p>
        </div>
        <button className="bg-gray-900 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-gray-800 transition-colors inline-flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Herramienta
        </button>
      </div>

      <div className="bg-white border rounded-xl border-gray-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar herramienta por nombre o correo..." 
              className="w-full text-sm pl-9 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-white">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Herramienta</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario / Correo</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MFA</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credenciales</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {db.sharedTools.map((tool) => (
              <tr key={tool.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{tool.name}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[200px]" title={tool.notes}>{tool.notes}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{tool.user}</div>
                  <div className="text-xs text-gray-500">Vinculado a: {tool.emailLinked}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className="inline-flex items-center py-0.5 px-2.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                    <HelpCircle className="w-3 h-3 mr-1 text-gray-500" />
                    {tool.mfaMethod}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {tool.password ? (
                    <div className="flex items-center">
                      <div className="font-mono text-sm bg-gray-100 px-2 py-1 rounded text-gray-800 select-all min-w-[120px] text-center">
                        {showPasswordFor === tool.id ? tool.password : '••••••••••••'}
                      </div>
                      <button 
                        onClick={() => showPasswordFor === tool.id ? setShowPasswordFor(null) : handleRevealPassword(tool.id)}
                        className="ml-2 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
                        title={showPasswordFor === tool.id ? "Ocultar Contraseña" : "Mostrar Contraseña"}
                      >
                        {showPasswordFor === tool.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 italic">No registrada</span>
                  )}
                  <div className="text-[10px] text-gray-400 mt-1 ml-1">Cambiada: {formatDate(tool.passwordDate)}</div>
                </td>
              </tr>
            ))}
            {db.sharedTools.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  No se han registrado herramientas compartidas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
