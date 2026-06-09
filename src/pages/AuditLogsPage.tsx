import React from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { Shield, Clock, Search, Filter } from 'lucide-react';
import { formatDate } from '../lib/utils';

export function AuditLogsPage() {
  const { db } = useDatabase();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Registro de Auditoría</h1>
          <p className="text-sm text-gray-500 mt-1">Historial inmutable de todas las acciones críticas del sistema.</p>
        </div>
      </div>

      <div className="bg-white border rounded-xl border-gray-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por usuario o registro..." 
              className="w-full text-sm pl-9 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button className="text-sm border border-gray-300 bg-white px-3 py-2 text-gray-700 font-medium rounded hover:bg-gray-50 flex items-center">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </button>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-white">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha / Hora</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Módulo / Registro</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {db.auditLogs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{formatDate(log.date)}</span>
                    <span className="ml-2 text-gray-400 text-xs">{log.time}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 font-medium">{log.user}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                    ${log.action === 'Visualización contraseña' ? 'bg-red-50 text-red-700 border border-red-100' : 
                      log.action === 'Eliminación' ? 'bg-gray-100 text-gray-800' :
                      log.action === 'Edición' ? 'bg-blue-50 text-blue-700' :
                      'bg-emerald-50 text-emerald-700'}`}>
                    {log.action}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{log.record}</div>
                  <div className="text-xs text-gray-500">{log.module}</div>
                </td>
              </tr>
            ))}
            {db.auditLogs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  No hay registros de auditoría.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
