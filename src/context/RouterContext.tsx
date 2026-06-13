import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { PageRoute } from '../types/router';

interface RouterContextType {
  route: PageRoute;
  navigate: (route: PageRoute) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

export function routeToPath(route: PageRoute) {
  switch (route.name) {
    case 'dashboard':
      return '/dashboard';
    case 'clients':
      return '/clientes';
    case 'client':
      return `/clientes/${encodeURIComponent(route.id)}`;
    case 'brand':
      return `/marcas/${encodeURIComponent(route.id)}`;
    case 'team':
      return '/equipo';
    case 'users':
      return '/usuarios';
    case 'tools':
      return '/herramientas';
    case 'audit':
      return '/auditoria';
    case 'settings':
      return '/configuracion';
    case 'search':
      return '/buscar';
    default:
      return '/dashboard';
  }
}

export function navigateToPath(path: string) {
  if (window.location.pathname === path) return;

  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
}

function pathToRoute(pathname: string): PageRoute {
  const parts = pathname.split('/').filter(Boolean).map(decodeURIComponent);

  if (parts.length === 0) return { name: 'dashboard' };
  if (parts[0] === 'dashboard') return { name: 'dashboard' };
  if (parts[0] === 'clientes' && parts[1]) return { name: 'client', id: parts[1] };
  if (parts[0] === 'clientes') return { name: 'clients' };
  if (parts[0] === 'marcas' && parts[1]) return { name: 'brand', id: parts[1] };
  if (parts[0] === 'equipo') return { name: 'team' };
  if (parts[0] === 'usuarios') return { name: 'users' };
  if (parts[0] === 'herramientas') return { name: 'tools' };
  if (parts[0] === 'auditoria') return { name: 'audit' };
  if (parts[0] === 'configuracion') return { name: 'settings' };
  if (parts[0] === 'buscar') return { name: 'search' };

  return { name: 'dashboard' };
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const route = pathToRoute(location.pathname);

  const navigate = (nextRoute: PageRoute) => {
    navigateToPath(routeToPath(nextRoute));
  };

  return (
    <RouterContext.Provider value={{ route, navigate, isSidebarOpen, setSidebarOpen }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const context = useContext(RouterContext);
  if (!context) throw new Error('useRouter must be used within RouterProvider');
  return context;
}
