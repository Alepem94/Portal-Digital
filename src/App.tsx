/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StrictMode } from 'react';
import { DatabaseProvider } from './context/DatabaseContext';
import { RouterProvider } from './context/RouterContext';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { AppContent } from './AppContent';

export default function App() {
  return (
    <AuthProvider>
      <DatabaseProvider>
        <RouterProvider>
          <AppLayout>
            <AppContent />
          </AppLayout>
        </RouterProvider>
      </DatabaseProvider>
    </AuthProvider>
  );
}
