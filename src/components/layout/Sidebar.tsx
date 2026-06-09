import React from 'react';
import { LayoutDashboard, Users, Briefcase, Wrench, Shield, Settings, LogOut, Menu, X, Search, UserCog } from 'lucide-react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const MENU_ITEMS = [
  { name: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { name: 'clients', label: 'Clientes', icon: Users },
  { name: 'team', label: 'Carga de Equipo', icon: Briefcase, role: 'Head de Medios Digitales' },
  { name: 'users', label: 'Gestión de Accesos', icon: UserCog, role: 'Head de Medios Digitales' },
  { name: 'tools', label: 'Herramientas', icon: Wrench },
  { name: 'audit', label: 'Auditoría', icon: Shield, role: 'Administrador' },
  { name: 'settings', label: 'Configuración', icon: Settings, role: 'Administrador' },
];

export function Sidebar() {
  const { route, navigate, isSidebarOpen, setSidebarOpen } = useRouter();
  const { signOut, userRole } = useAuth();

  const agencyName = localStorage.getItem('agency_name') || 'República Digital';
  const logoChar = localStorage.getItem('agency_logo') || '★';
  const colorMap: Record<string, string> = {
    blue: 'bg-[#0047b3]',
    indigo: 'bg-indigo-600',
    purple: 'bg-purple-600',
    rose: 'bg-rose-600',
    red: 'bg-[#e50000]',
    emerald: 'bg-emerald-600',
    amber: 'bg-amber-600',
    slate: 'bg-slate-800',
    black: 'bg-black',
  };
  const primaryColor = localStorage.getItem('agency_color') || 'black';
  const bgClass = colorMap[primaryColor] || 'bg-slate-900';

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
          "fixed top-0 left-0 bottom-0 z-50 w-64 bg-white border-r border-gray-200",
          "text-gray-600 flex flex-col",
          "lg:translate-x-0 lg:static"
        )}
      >
        <div className="flex h-14 items-center px-4 shrink-0">
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="h-6 w-auto object-contain"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {MENU_ITEMS.map((item) => {
            if (item.role && userRole !== item.role && userRole !== 'Administrador') return null;
            const Icon = item.icon;
            const isActive = route.name === item.name || (item.name === 'clients' && (route.name === 'client' || route.name === 'brand'));
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
                    ? `bg-gray-100 text-gray-900` 
                    : "hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon className={cn("w-4 h-4 mr-3 shrink-0", isActive ? "text-gray-900" : "text-gray-500")} />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={signOut}
            className="flex w-full items-center px-3 py-2 text-sm font-medium text-gray-500 hover:text-red-600 transition-colors rounded-md hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Cerrar sesión
          </button>
        </div>
      </motion.aside>
    </>
  );
}
