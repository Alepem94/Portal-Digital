import React, { createContext, useContext, useState, ReactNode } from 'react';
import { PageRoute } from '../types/router';

interface RouterContextType {
  route: PageRoute;
  navigate: (route: PageRoute) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<PageRoute>({ name: 'dashboard' });
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  return (
    <RouterContext.Provider value={{ route, navigate: setRoute, isSidebarOpen, setSidebarOpen }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const context = useContext(RouterContext);
  if (!context) throw new Error('useRouter must be used within RouterProvider');
  return context;
}
