import React from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { Users, Briefcase, Key, Shield, Clock, TrendingUp } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';

export function DashboardPage() {
  const { db } = useDatabase();
  const { getVisibleClients, getVisibleBrands } = usePermissions();
  
  const visibleClients = getVisibleClients();
  const visibleBrands = getVisibleBrands();

  const stats = [
    { label: 'Clientes Activos', value: visibleClients.filter(c => c.status === 'Activo').length, icon: Users, color: 'text-slate-900', bg: 'bg-slate-100' },
    { label: 'Marcas', value: visibleBrands.length, icon: Briefcase, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { label: 'Herramientas', value: db.sharedTools.length, icon: Key, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: 'Activos Digitales', value: db.digitalAssets.length, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-start">
              <div className={`p-3 rounded-lg ${stat.bg} ${stat.color} mr-4`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 font-medium text-gray-800 flex items-center">
            <Clock className="w-4 h-4 mr-2 text-gray-500" /> Actividad Reciente
          </div>
          <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
            {db.auditLogs.slice(0, 10).map((log) => (
              <div key={log.id} className="p-4 flex flex-col justify-center">
                <p className="text-sm text-gray-800 font-medium">{log.action}</p>
                <p className="text-xs text-gray-500 mt-1">{log.record} - <span className="text-gray-400">{log.date} {log.time}</span></p>
              </div>
            ))}
            {db.auditLogs.length === 0 && (
              <div className="p-8 text-center text-gray-500 text-sm">No hay actividad reciente.</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 font-medium text-gray-800 flex items-center">
            <Shield className="w-4 h-4 mr-2 text-gray-500" /> Seguridad
          </div>
          <div className="p-5">
            <div className="space-y-4">
              <div className="bg-red-50 p-4 rounded-lg flex justify-between items-center border border-red-100">
                <span className="text-sm font-medium text-red-800">Contraseñas sin actualizar ({'>'} 180 días)</span>
                <span className="text-lg font-bold text-red-600">0</span>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg flex justify-between items-center border border-amber-100">
                <span className="text-sm font-medium text-amber-800">Contraseñas por expirar ({'>'} 90 días)</span>
                <span className="text-lg font-bold text-amber-600">
                  {(db.socialProfiles || []).filter(i => i.passwordDate && new Date(i.passwordDate).getTime() < Date.now() - 90 * 24 * 60 * 60 * 1000).length}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center">
              Recomendamos rotar contraseñas críticas cada 90 días por protocolo de seguridad.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
