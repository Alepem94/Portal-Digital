import React from 'react';
import { LayoutDashboard, Users, Briefcase, Wrench, Shield, Settings, LogOut, Menu, X, Search } from 'lucide-react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const MENU_ITEMS = [
  { name: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { name: 'clients', label: 'Clientes', icon: Users },
  { name: 'brands', label: 'Marcas', icon: Briefcase },
  { name: 'tools', label: 'Herramientas', icon: Wrench },
  { name: 'audit', label: 'Auditoría', icon: Shield },
  { name: 'settings', label: 'Configuración', icon: Settings },
];

export function Sidebar() {
  const { route, navigate, isSidebarOpen, setSidebarOpen } = useRouter();
  const { signOut } = useAuth();

  const agencyName = localStorage.getItem('agency_name') || 'AGENCY PORTAL';
  const logoChar = localStorage.getItem('agency_logo') || 'A';
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-600',
    indigo: 'bg-indigo-600',
    purple: 'bg-purple-600',
    rose: 'bg-rose-600',
    emerald: 'bg-emerald-600',
    amber: 'bg-amber-600',
    slate: 'bg-slate-800'
  };
  const primaryColor = localStorage.getItem('agency_color') || 'blue';
  const bgClass = colorMap[primaryColor] || 'bg-blue-600';

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: isSidebarOpen ? 0 : -300 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
        className={cn(
          "fixed top-0 left-0 bottom-0 z-50 w-64 bg-gray-900 border-r border-gray-800",
          "text-gray-300 flex flex-col",
          "lg:translate-x-0 lg:static"
        )}
      >
        <div className="flex h-14 items-center px-4 font-semibold text-white tracking-tight border-b border-gray-800 shrink-0">
          <div className={`flex ${bgClass} text-white rounded-md w-8 h-8 items-center justify-center mr-3 font-bold uppercase`}>
            {logoChar}
          </div>
          {agencyName}
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = route.name === item.name;
            return (
              <button
                key={item.name}
                onClick={() => {
                  navigate({ name: item.name as any });
                  if (window.innerWidth < 1024) setSidebarOpen(false);
                }}
                className={cn(
                  "flex w-full items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive 
                    ? "bg-gray-800 text-white" 
                    : "hover:bg-gray-800 hover:text-white"
                )}
              >
                <Icon className="w-4 h-4 mr-3 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={signOut}
            className="flex w-full items-center px-3 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors rounded-md hover:bg-gray-800"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Cerrar sesión
          </button>
        </div>
      </motion.aside>
    </>
  );
}
