import React from 'react';
import { useRouter } from './context/RouterContext';
import { useDatabase } from './context/DatabaseContext';
import { useAuth } from './context/AuthContext';
import { DashboardPage } from './pages/DashboardPage';
import { ClientsPage } from './pages/ClientsPage';
import { ClientDetailPage } from './pages/ClientDetailPage';
import { BrandsPage } from './pages/BrandsPage';
import { BrandDetailPage } from './pages/BrandDetailPage';
import { ToolsPage } from './pages/ToolsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SettingsPage } from './pages/SettingsPage';
import { Shield } from 'lucide-react';

function RouterView() {
  const { route } = useRouter();

  switch (route.name) {
    case 'dashboard':
      return <DashboardPage />;
    case 'clients':
      return <ClientsPage />;
    case 'client':
      return <ClientDetailPage />;
    case 'brands':
      return <BrandsPage />;
    case 'brand':
      return <BrandDetailPage />;
    case 'tools':
      return <ToolsPage />;
    case 'audit':
      return <AuditLogsPage />;
    case 'settings':
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
  const { user, loading, signInWithGoogle, signInWithEmail } = useAuth();
  const missingEnv = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'YOUR_SUPABASE_URL';
  const [email, setEmail] = React.useState('');
  const [emailSent, setEmailSent] = React.useState(false);
  const [loginLoading, setLoginLoading] = React.useState(false);
  const [oauthError, setOauthError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Check for error in URL hash (Supabase OAuth callbacks can return errors this way)
    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const errorDesc = hashParams.get('error_description');
      if (errorDesc) {
        setOauthError(decodeURIComponent(errorDesc).replace(/\+/g, ' '));
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
    // Also check query params for ?error_description=
    if (window.location.search) {
      const searchParams = new URLSearchParams(window.location.search);
      const errorDesc = searchParams.get('error_description');
      if (errorDesc) {
        setOauthError(decodeURIComponent(errorDesc).replace(/\+/g, ' '));
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoginLoading(true);
    try {
      await signInWithEmail(email);
      setEmailSent(true);
    } catch (err) {
      alert('Error enviando el enlace magico');
    } finally {
      setLoginLoading(false);
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center p-4 bg-gray-50"><div className="animate-spin w-8 h-8 rounded-full border-4 border-blue-600 border-t-transparent"></div></div>;
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
      <div className="flex h-screen flex-col items-center justify-center p-4 bg-gray-50">
        <div className="bg-white p-8 md:p-10 rounded-2xl shadow-xl max-w-md w-full border border-gray-100 text-center">
          <div className="flex bg-blue-600 text-white rounded-xl w-14 h-14 items-center justify-center mx-auto mb-6 font-bold text-2xl shadow-lg">
            A
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">Portal Operativo</h1>
          <p className="text-gray-500 mb-8 text-sm">Validación de identidad requerida para acceder al sistema.</p>
          
          {oauthError && (
            <div className="bg-red-50 text-red-800 p-4 rounded-lg mb-6 border border-red-200 text-sm text-left">
              <h3 className="font-bold flex items-center mb-1"><Shield className="w-4 h-4 mr-1.5"/> Error de Autenticación</h3>
              <p>{oauthError === 'Database error saving new user' 
                ? 'Tu correo no está registrado en la base de datos de usuarios permitidos (Whitelist). Pide a un administrador que te agregue primero.'
                : oauthError}</p>
            </div>
          )}

          {emailSent ? (
            <div className="bg-green-50 text-green-800 p-4 rounded-lg mb-6 border border-green-200">
              <h3 className="font-bold mb-1">¡Enlace enviado!</h3>
              <p className="text-sm">Revisa la bandeja de entrada de {email} y haz clic en el enlace para entrar.</p>
              <button 
                onClick={() => setEmailSent(false)}
                className="mt-4 text-sm text-green-700 underline font-medium"
              >
                Volver a intentar
              </button>
            </div>
          ) : (
            <form onSubmit={handleEmailLogin} className="mb-6 space-y-4 text-left">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@agencia.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                />
              </div>
              <button 
                type="submit"
                disabled={loginLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loginLoading ? 'Enviando enlace...' : 'Entrar con correo (Magic Link)'}
              </button>
            </form>
          )}

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">o también</span>
            </div>
          </div>

          <button 
            onClick={signInWithGoogle}
            className="w-full bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-800 font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center mb-4"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Acceder con Google
          </button>
          
          <div className="mt-8 text-xs text-gray-400">
            Acceso restringido únicamente a personal autorizado de la agencia.
          </div>
        </div>
      </div>
    );
  }

  return (
    <RouterView />
  );
}
