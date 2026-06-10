import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Auth Callback Page
 * Handles OAuth redirects from Google/Supabase
 * Used when app is embedded in ClickUp or other contexts
 */
export function AuthCallbackPage() {
  const { user, loading } = useAuth();

  useEffect(() => {
    // Log for debugging
    console.log('AuthCallbackPage - User:', user, 'Loading:', loading);

    // If we're in an iframe (ClickUp), notify parent window of auth success
    if (user && window.self !== window.top) {
      console.log('Notifying parent window of auth success');
      window.parent.postMessage(
        { 
          type: 'AUTH_SUCCESS', 
          user: {
            id: user.id,
            email: user.email,
            user_metadata: user.user_metadata
          }
        }, 
        '*'
      );
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center p-4 bg-gray-50">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 rounded-full border-4 border-slate-900 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Autenticando...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex h-screen items-center justify-center p-4 bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-100 text-center">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Autenticado!</h1>
          <p className="text-gray-600 mb-6">Tu sesión se ha iniciado correctamente.</p>
          {window.self !== window.top && (
            <p className="text-sm text-gray-500">Redirigiendo a ClickUp...</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center p-4 bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-100 text-center">
        <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 4v2M6.34 8.34l1.41-1.41m2 2l1.41-1.41m2 2l1.41-1.41m2 2l1.41-1.41M12 12m0 0l-4-4m4 4l4-4m-4 4l-4 4m4-4l4 4" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Error de Autenticación</h1>
        <p className="text-gray-600 mb-6">No se pudo completar la autenticación. Intenta nuevamente.</p>
        <button 
          onClick={() => window.history.back()}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Volver
        </button>
      </div>
    </div>
  );
}
