import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  userRole: string | null;
  accessDenied: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    // Obtener sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        verifyWhitelist(session.user.email);
      } else {
        setLoading(false);
      }
    });

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        verifyWhitelist(session.user.email);
        
        // Registrar inicio de sesión
        if (event === 'SIGNED_IN' && session.user.email) {
          const now = new Date();
          supabase.from('audit_logs').insert([{
            user_email: session.user.email,
            action: 'Inicio de Sesión',
            record: 'Portal Operativo',
            module: 'Autenticación',
            date: now.toISOString().split('T')[0],
            time: now.toTimeString().split(' ')[0]
          }]).then(({ error }) => {
            if (error) console.error(error);
          });
        }
      } else {
        setUserRole(null);
      }
      
      if (!session?.user) {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Verificar si el usuario está en la whitelist
  const verifyWhitelist = async (email?: string) => {
    if (!email) {
      setLoading(false);
      return;
    }
    
    try {
      // Usar ilike para comparación case-insensitive del email
      const { data, error } = await supabase
        .from('users')
        .select('role, active')
        .ilike('email', email)
        .single();

      if (error || !data) {
        console.warn('Correo no encontrado en whitelist:', email);
        setUserRole(null);
        setAccessDenied(true);
        setLoading(false);
        await supabase.auth.signOut();
        return;
      }

      if (!data.active) {
        console.warn('Usuario desactivado:', email);
        setUserRole(null);
        setAccessDenied(true);
        setLoading(false);
        await supabase.auth.signOut();
        return;
      }

      // Usuario autorizado ✅
      setUserRole(data.role);
      setAccessDenied(false);
      setLoading(false);
    } catch (err) {
      console.error('Error verificando whitelist:', err);
      setUserRole(null);
      setAccessDenied(true);
      setLoading(false);
      await supabase.auth.signOut();
    }
  };

  const signInWithGoogle = async () => {
    setAccessDenied(false);
    try {
      console.log('🔐 Iniciando login con Google...');
      
      const redirectUrl = `${window.location.origin}/auth/callback`;
      console.log('🎯 OAuth redirect URL:', redirectUrl);

      // Usar método que abre en nueva ventana (mejor para ClickUp desktop)
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false, // Dejar que Supabase maneje la redirección
        }
      });
      
      if (error) {
        console.error('❌ Error OAuth:', error.message);
        throw error;
      }
      
      console.log('✅ OAuth iniciado correctamente');
    } catch (error: any) {
      console.error('❌ Error al iniciar sesión:', error.message);
      alert('Error de conexión a OAuth: ' + (error.message || 'Verifica tu configuración de Supabase'));
    }
  };

  const signOut = async () => {
    setAccessDenied(false);
    setUserRole(null);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signInWithGoogle, signOut, userRole, accessDenied }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
