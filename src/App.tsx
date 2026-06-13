/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StrictMode } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { DatabaseProvider } from './context/DatabaseContext';
import { RouterProvider } from './context/RouterContext';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { AppContent } from './AppContent';

function AppShell() {
  const location = useLocation();

  if (location.pathname === '/auth/callback') {
    return <AppContent />;
  }

  return (
    <AppLayout>
      <AppContent />
    </AppLayout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DatabaseProvider>
          <RouterProvider>
            <AppShell />
          </RouterProvider>
        </DatabaseProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
