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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Obtener sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchUserRole(session.user.email);
      setLoading(false);
    });

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.email);
        
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
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (email?: string) => {
    if (!email) return;
    try {
      // Intentar obtener rol de Supabase
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('email', email)
        .single();
      
      if (data) {
        setUserRole(data.role);
        return;
      }
    } catch (err) {
      console.error('Error fetching user role from Supabase, falling back to local DB:', err);
    }
    
    // Hardcoded dev fallback para el dueño
    if (email === 'alepemu.rd@gmail.com' || email.includes('admin')) {
      setUserRole('Administrador');
      return;
    }
    try {
      const stored = localStorage.getItem('agency_db');
      if (stored) {
        const agencyDb = JSON.parse(stored);
        const localUser = agencyDb.users?.find((u: any) => u.email === email && u.active);
        if (localUser) {
          setUserRole(localUser.role);
          return;
        }
      }
    } catch (e) {
      // ignore
    }
  };

  const signInWithGoogle = async () => {
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
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signInWithGoogle, signOut, userRole }}>
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
