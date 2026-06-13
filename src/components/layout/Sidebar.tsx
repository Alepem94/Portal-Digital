import React from 'react';
import { LayoutDashboard, Users, Briefcase, Wrench, Shield, Settings, LogOut, UserCog } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { navigateToPath, routeToPath, useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { PermissionKey } from '../../types';
import { PageRoute } from '../../types/router';
import { cn } from '../../lib/utils';

type MenuRouteName = Exclude<PageRoute['name'], 'client' | 'brand'>;

const MENU_ITEMS: Array<{
  name: MenuRouteName;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: PermissionKey;
  adminOnly?: boolean;
}> = [
  { name: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { name: 'clients', label: 'Clientes', icon: Users },
  { name: 'team', label: 'Carga de Equipo', icon: Briefcase, permission: 'canEditAccounts' },
  { name: 'users', label: 'Gestion de Accesos', icon: UserCog, permission: 'canManageUsers' },
  { name: 'tools', label: 'Herramientas', icon: Wrench },
  { name: 'audit', label: 'Auditoria', icon: Shield, adminOnly: true },
  { name: 'settings', label: 'Configuracion', icon: Settings, adminOnly: true },
];

export function Sidebar() {
  const { route, isSidebarOpen, setSidebarOpen } = useRouter();
  const { signOut } = useAuth();
  const { isAdmin, hasPermission } = usePermissions();

  return (
    <>
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
          'fixed top-0 left-0 bottom-0 z-50 w-64 bg-white border-r border-gray-200',
          'text-gray-600 flex flex-col',
          'lg:translate-x-0 lg:static'
        )}
      >
        <div className="flex h-14 items-center px-4 shrink-0">
          <img src="/logo.png" alt="Logo" className="h-6 w-auto object-contain" />
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {MENU_ITEMS.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            if (item.permission && !hasPermission(item.permission)) return null;

            const Icon = item.icon;
            const isActive = route.name === item.name || (item.name === 'clients' && (route.name === 'client' || route.name === 'brand'));
            const path = routeToPath({ name: item.name });

            return (
              <a
                key={item.name}
                href={path}
                onClick={(event) => {
                  event.preventDefault();
                  if (window.innerWidth < 1024) setSidebarOpen(false);
                  navigateToPath(path);
                }}
                className={cn(
                  'flex w-full items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive ? 'bg-gray-100 text-gray-900' : 'hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon className={cn('w-4 h-4 mr-3 shrink-0', isActive ? 'text-gray-900' : 'text-gray-500')} />
                {item.label}
              </a>
            );
          })}
        </div>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={signOut}
            className="flex w-full items-center px-3 py-2 text-sm font-medium text-gray-500 hover:text-red-600 transition-colors rounded-md hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Cerrar sesion
          </button>
        </div>
      </motion.aside>
    </>
  );
}
