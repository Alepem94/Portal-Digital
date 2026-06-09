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
      try {
        const parsed = JSON.parse(stored);
        if (parsed) {
          setDb(prev => ({ ...initialData, ...parsed }));
        }
      } catch (e) {
        setDb(initialData);
      }
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
          
        // Cargar otras tablas combinadas
        const [
           { data: clientsData },
           { data: brandsData },
           { data: toolsData },
           { data: socialProfilesData },
           { data: adAccountsData },
           { data: digitalAssetsData },
           { data: brandLinksData },
           { data: mfaCodesData },
           { data: usersData }
        ] = await Promise.all([
           supabase.from('clients').select('*'),
           supabase.from('brands').select('*'),
           supabase.from('tools_agency').select('*'),
           supabase.from('social_profiles').select('*'),
           supabase.from('ad_accounts').select('*'),
           supabase.from('digital_assets').select('*'),
           supabase.from('brand_links').select('*'),
           supabase.from('mfa_codes').select('*'),
           supabase.from('users').select('*')
        ]);
        
        let newDbState: Partial<AppDatabase> = {};

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
          newDbState.auditLogs = mappedLogs;
        }

        if (usersData && usersData.length > 0) {
           newDbState.users = usersData.map(u => ({
             id: u.id, name: u.name || '', email: u.email, role: u.role, active: u.active, canEdit: u.can_edit
           }));
        }

        if (clientsData && clientsData.length > 0) {
           newDbState.clients = clientsData.map(c => ({
             id: c.id, name: c.name, status: c.status, dateAdded: c.date_added, notes: c.notes
           }));
        }

        if (brandsData && brandsData.length > 0) {
           newDbState.brands = brandsData.map(b => ({
             id: b.id, clientId: b.client_id, name: b.name, logo: b.logo, website: b.website, notes: b.notes,
             accountManager: b.account_manager, analysts: b.analysts || [], cms: b.cms || [], brandStrategist: b.brand_strategist
           }));
        }

        if (toolsData && toolsData.length > 0) {
           newDbState.sharedTools = toolsData.map(t => ({
             id: t.id, name: t.name, utilidad: t.utilidad, loginType: t.login_type, user: t.user_id_email,
             password: t.password, emailLinked: t.email_linked, mfaMethod: t.mfa_method,
             smsPhone: t.sms_phone, smsResponsible: t.sms_responsible, authAppEmail: t.auth_app_email,
             emailReceiver: t.email_receiver, notes: t.notes, passwordDate: t.password_date, totpSecret: t.totp_secret
           }));
        }

        if (socialProfilesData && socialProfilesData.length > 0) {
           newDbState.socialProfiles = socialProfilesData.map(s => ({
             id: s.id, brandId: s.brand_id, platform: s.platform, username: s.username, url: s.url,
             loginUser: s.login_user, password: s.password, passwordDate: s.password_date,
             emailLinked: s.email_linked, phoneLinked: s.phone_linked, mfaMethod: s.mfa_method,
             notes: s.notes, totpSecret: s.totp_secret
           }));
        }

        if (adAccountsData && adAccountsData.length > 0) {
           newDbState.adAccounts = adAccountsData.map(a => ({
             id: a.id, brandId: a.brand_id, platform: a.platform, accountId: a.account_id,
             user: a.account_user, email: a.email, accessLevel: a.access_level, notes: a.notes
           }));
        }

        if (digitalAssetsData && digitalAssetsData.length > 0) {
           newDbState.digitalAssets = digitalAssetsData.map(d => ({
             id: d.id, brandId: d.brand_id, type: d.type, name: d.name, url: d.url,
             ownership: d.ownership, status: d.status, notes: d.notes
           }));
        }
        
        if (brandLinksData && brandLinksData.length > 0) {
           newDbState.brandLinks = brandLinksData.map(b => ({
             id: b.id, brandId: b.brand_id, type: b.type, name: b.name, url: b.url
           }));
        }

        if (mfaCodesData && mfaCodesData.length > 0) {
           newDbState.mfaCodes = mfaCodesData.map(m => ({
             id: m.id, accountId: m.account_id, code: m.code, status: m.status,
             usedBy: m.used_by, usedDate: m.used_date, usedTime: m.used_time
           }));
        }

        setDb(prev => ({ ...prev, ...newDbState }));
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
      const { error } = await supabase.from('audit_logs').insert([{
        user_email: currentUserEmail,
        action,
        record,
        module,
        date: newLog.date,
        time: newLog.time
      }]);
      if (error) console.error('Error insertando en audit_logs de supabase:', error);
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
