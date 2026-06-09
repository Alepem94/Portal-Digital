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
        
        // Registrar inicio de sesión en Supabase si es un nuevo sign in
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
        setAccessDenied(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Verificar si el usuario está en la whitelist y obtener su rol
  const verifyWhitelist = async (email?: string) => {
    if (!email) {
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role, active')
        .eq('email', email)
        .single();

      if (error || !data) {
        // El correo NO está en la tabla users → no autorizado
        console.warn('Correo no encontrado en whitelist:', email);
        setUserRole(null);
        setAccessDenied(true);
        // Cerrar sesión inmediatamente
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setLoading(false);
        return;
      }

      if (!data.active) {
        // El usuario existe pero está desactivado
        console.warn('Usuario desactivado:', email);
        setUserRole(null);
        setAccessDenied(true);
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setLoading(false);
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
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setAccessDenied(false); // Limpiar estado al intentar de nuevo
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Error al iniciar sesión:', error);
      alert('Error de conexión a OAuth: ' + (error.message || 'Verifica tu configuración de URL de Supabase'));
    }
  };

  const signOut = async () => {
    setAccessDenied(false);
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
