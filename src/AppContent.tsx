import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { navigateToPath, useRouter } from './context/RouterContext';
import { useAuth } from './context/AuthContext';
import { DashboardPage } from './pages/DashboardPage';
import { ClientsPage } from './pages/ClientsPage';
import { ClientDetailPage } from './pages/ClientDetailPage';
import { BrandDetailPage } from './pages/BrandDetailPage';
import { ToolsPage } from './pages/ToolsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SettingsPage } from './pages/SettingsPage';
import { TeamWorkloadPage } from './pages/TeamWorkloadPage';
import { UsersPage } from './pages/UsersPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { Shield } from 'lucide-react';
import { usePermissions } from './hooks/usePermissions';

function PermissionDenied() {
  const { navigate } = useRouter();

  return (
    <div className="p-12 text-center text-gray-500 bg-white rounded-xl shadow-sm border border-gray-200">
      No tienes permisos para acceder a esta seccion.
      <button onClick={() => navigate({ name: 'dashboard' })} className="block mx-auto mt-4 text-blue-600 hover:underline">Volver al Dashboard</button>
    </div>
  );
}

function RouterView() {
  const { route } = useRouter();
  const { isAdmin, hasPermission } = usePermissions();

  switch (route.name) {
    case 'dashboard':
      return <DashboardPage />;
    case 'clients':
      return <ClientsPage />;
    case 'client':
      return <ClientDetailPage />;
    case 'brand':
      return <BrandDetailPage />;
    case 'team':
      if (!hasPermission('canEditAccounts')) return <PermissionDenied />;
      return <TeamWorkloadPage />;
    case 'users':
      if (!hasPermission('canManageUsers')) return <PermissionDenied />;
      return <UsersPage />;
    case 'tools':
      return <ToolsPage />;
    case 'audit':
      if (!isAdmin) return <PermissionDenied />;
      return <AuditLogsPage />;
    case 'settings':
      if (!isAdmin) return <PermissionDenied />;
      return <SettingsPage />;
    default:
      return (
        <div className="p-8 text-center text-gray-500">
          Vista no implementada: {route.name}
        </div>
      );
  }
}

export function AppContent() {
  const { user, loading, signInWithGoogle, accessDenied } = useAuth();
  const location = useLocation();
  const missingEnv = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'YOUR_SUPABASE_URL';

  useEffect(() => {
    if (!loading && user && location.pathname === '/') {
      navigateToPath('/dashboard');
    }
  }, [user, loading, location.pathname]);

  // Check if we're on the auth callback page
  if (location.pathname === '/auth/callback') {
    return <AuthCallbackPage />;
  }

  if (loading) {
    return <div className="flex h-screen items-center justify-center p-4 bg-gray-50"><div className="animate-spin w-8 h-8 rounded-full border-4 border-slate-900 border-t-transparent"></div></div>;
  }

  if (missingEnv && !user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4 bg-gray-50 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-100">
          <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-600">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">Falta Configuración</h1>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Para proteger los accesos, la aplicación requiere conexión a Supabase.
            Agrega las claves VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY a tus variables de entorno para continuar.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Revisar de nuevo
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4 bg-slate-50">
        <div className="bg-white p-8 md:p-10 rounded-2xl shadow-xl max-w-md w-full border border-gray-100 text-center">
          <div className="mx-auto mb-8 flex justify-center items-center">
            <img 
              src="/logo.png" 
              alt="República Digital" 
              className="h-10 w-auto object-contain cursor-pointer" 
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">Portal Operativo</h1>
          <p className="text-gray-500 mb-8 text-sm">Validación de identidad requerida para acceder al sistema.</p>
          
          {accessDenied && (
            <div className="bg-red-50 text-red-800 p-4 rounded-lg mb-6 border border-red-200 text-sm text-left">
              <h3 className="font-bold flex items-center mb-1"><Shield className="w-4 h-4 mr-1.5"/> Acceso Denegado</h3>
              <p>Tu correo no está registrado en la lista de usuarios autorizados. Solicita a un administrador que te agregue al sistema.</p>
            </div>
          )}

          <button 
            onClick={signInWithGoogle}
            className="w-full bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center mb-4 shadow-sm"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Acceder con Google
          </button>
          
          <div className="mt-8 text-[11px] text-gray-400">
            El portal es propiedad privada de República Digital con acceso restringido a personal autorizado.
          </div>
        </div>
      </div>
    );
  }

  return (
    <RouterView />
  );
}
