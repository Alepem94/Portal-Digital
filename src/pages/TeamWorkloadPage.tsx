import React, { useMemo } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { Users, Briefcase, BarChart3, Database } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

export function TeamWorkloadPage() {
  const { db } = useDatabase();

  const workloadData = useMemo(() => {
    const analysts: Record<string, { brands: number, social: number, ads: number }> = {};
    const cms: Record<string, { brands: number, social: number }> = {};
    const strategists: Record<string, { brands: number }> = {};
    
    // Process brands
    db.brands.forEach(brand => {
      // Analysts
      (brand.analysts || []).forEach(name => {
        if (!name) return;
        if (!analysts[name]) analysts[name] = { brands: 0, social: 0, ads: 0 };
        analysts[name].brands += 1;
      });
      // CMs
      (brand.cms || []).forEach(name => {
        if (!name) return;
        if (!cms[name]) cms[name] = { brands: 0, social: 0 };
        cms[name].brands += 1;
      });
      // Strategist
      if (brand.brandStrategist) {
        if (!strategists[brand.brandStrategist]) strategists[brand.brandStrategist] = { brands: 0 };
        strategists[brand.brandStrategist].brands += 1;
      }
    });

    // Count Ads accounts
    const countAdsUser = (user?: string) => {
        if (!user) return;
        if (!analysts[user]) analysts[user] = { brands: 0, social: 0, ads: 0 };
        analysts[user].ads += 1;
    };
    
    (db.adAccounts || []).forEach(acc => countAdsUser(acc.user));

    return { analysts, cms, strategists };
  }, [db]);

  const analystChartData = Object.keys(workloadData.analysts).map(name => ({
    name,
    Marcas: workloadData.analysts[name].brands,
    'Cuentas Ads': workloadData.analysts[name].ads
  }));
  
  const cmsChartData = Object.keys(workloadData.cms).map(name => ({
    name,
    Marcas: workloadData.cms[name].brands
  }));

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Carga de Equipo (Workload)</h1>
        <p className="text-gray-500 mt-1">Visión global de distribución de marcas y accesos por analista y CM.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
           <div className="flex items-center mb-4">
               <BarChart3 className="w-5 h-5 text-blue-600 mr-2" />
               <h3 className="text-lg font-semibold text-gray-900">Analistas (Marcas y Ads)</h3>
           </div>
           {analystChartData.length > 0 ? (
           <div className="h-72">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={analystChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} />
                 <XAxis dataKey="name" tick={{fontSize: 12}} />
                 <YAxis tick={{fontSize: 12}} />
                 <Tooltip />
                 <Legend />
                 <Bar dataKey="Marcas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                 <Bar dataKey="Cuentas Ads" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
               </BarChart>
             </ResponsiveContainer>
           </div>
           ) : <p className="text-sm text-gray-500 py-10 text-center">No hay datos de analistas registrados.</p>}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
           <div className="flex items-center mb-4">
               <Users className="w-5 h-5 text-pink-600 mr-2" />
               <h3 className="text-lg font-semibold text-gray-900">Community Managers (Marcas)</h3>
           </div>
           {cmsChartData.length > 0 ? (
           <div className="h-72">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={cmsChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} />
                 <XAxis dataKey="name" tick={{fontSize: 12}} />
                 <YAxis tick={{fontSize: 12}} />
                 <Tooltip />
                 <Legend />
                 <Bar dataKey="Marcas" fill="#ec4899" radius={[4, 4, 0, 0]} />
               </BarChart>
             </ResponsiveContainer>
           </div>
           ) : <p className="text-sm text-gray-500 py-10 text-center">No hay datos de CMs registrados.</p>}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
         <div className="px-5 py-4 border-b border-gray-200 bg-slate-50">
            <h3 className="font-semibold text-slate-800">Detalle por Analista</h3>
         </div>
         <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nombre</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Marcas Asignadas</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Accesos a Ads</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
               {analystChartData.map(a => (
                 <tr key={a.name} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">{a.name}</td>
                    <td className="px-5 py-3 text-sm text-center text-gray-600">{a.Marcas}</td>
                    <td className="px-5 py-3 text-sm text-center text-gray-600">{a['Cuentas Ads']}</td>
                 </tr>
               ))}
               {analystChartData.length === 0 && (
                 <tr>
                    <td colSpan={3} className="px-5 py-8 text-center text-sm text-gray-500 italic">No hay información para mostrar</td>
                 </tr>
               )}
            </tbody>
         </table>
      </div>
    </div>
  );
}
