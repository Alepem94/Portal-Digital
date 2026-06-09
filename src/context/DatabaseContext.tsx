import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppDatabase, AuditLog } from '../types';
import { initialData } from '../data/mock';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface DatabaseContextType {
  db: AppDatabase;
  updateData: <K extends keyof AppDatabase>(table: K, data: AppDatabase[K]) => void;
  logAction: (action: AuditLog['action'], record: string, module: string) => void;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<AppDatabase>(initialData);
  const { user } = useAuth();
  const currentUserEmail = user?.email || 'Desconocido';

  useEffect(() => {
    // Almacenamiento local para los datos mock (herramientas, marcas, etc)
    const stored = localStorage.getItem('agency_db');
    if (stored) {
      setDb(JSON.parse(stored));
    } else {
      localStorage.setItem('agency_db', JSON.stringify(initialData));
    }

    const fetchSupabaseData = async () => {
      try {
        // Cargar historial de auditoría
        const { data: logsData, error: logsError } = await supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);
          
        if (logsData && !logsError) {
          const mappedLogs: AuditLog[] = logsData.map(log => ({
            id: log.id,
            date: log.date,
            time: log.time,
            user: log.user_email,
            action: log.action as any,
            record: log.record,
            module: log.module
          }));
          
          setDb(prev => ({
            ...prev,
            auditLogs: mappedLogs.length > 0 ? mappedLogs : prev.auditLogs
          }));
        }

        // Cargar usuarios
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('*');
          
        if (usersData && !usersError) {
          const mappedUsers = usersData.map(u => ({
            id: u.id,
            name: u.name || u.email.split('@')[0],
            email: u.email,
            role: u.role,
            active: u.active ?? true
          }));
          
          if (mappedUsers.length > 0) {
            setDb(prev => ({
              ...prev,
              users: mappedUsers
            }));
            
            // Sincronizar al localStorage
            setDb(prev => {
               localStorage.setItem('agency_db', JSON.stringify(prev));
               return prev;
            });
          }
        }
      } catch (e) {
        console.error('Error fetching from Supabase', e);
      }
    };

    fetchSupabaseData();
  }, []);

  const updateData = <K extends keyof AppDatabase>(table: K, data: AppDatabase[K]) => {
    setDb(prev => {
      const newDb = { ...prev, [table]: data };
      localStorage.setItem('agency_db', JSON.stringify(newDb));
      return newDb;
    });
  };

  const logAction = async (action: AuditLog['action'], record: string, module: string) => {
    const now = new Date();
    
    // Fallback log in-memory/local
    const newLog: AuditLog = {
      id: Math.random().toString(36).substr(2, 9),
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0],
      user: currentUserEmail,
      action,
      record,
      module
    };

    updateData('auditLogs', [newLog, ...db.auditLogs]);

    // Registro inmutable real en Supabase
    try {
      if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
        const { error } = await supabase.from('audit_logs').insert([{
          user_email: currentUserEmail,
          action,
          record,
          module,
          date: newLog.date,
          time: newLog.time
        }]);
        if (error) console.error('Error insertando en audit_logs de supabase:', error);
      }
    } catch (e) {
      console.error('Excepción al insertar en audit_logs:', e);
    }
  };

  return (
    <DatabaseContext.Provider value={{ db, updateData, logAction }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}
