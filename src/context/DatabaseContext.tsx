import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { AppDatabase, AuditLog } from '../types';
import { initialData } from '../data/mock';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

type PersistedTable = Exclude<keyof AppDatabase, 'auditLogs' | 'changeLogs'>;
type RowWithId = { id: string };

interface DatabaseContextType {
  db: AppDatabase;
  updateData: <K extends PersistedTable>(table: K, data: AppDatabase[K]) => Promise<void>;
  logAction: (action: AuditLog['action'], record: string, module: string) => Promise<void>;
}

interface TableConfig<T extends RowWithId> {
  supabaseTable: string;
  fromSupabase: (row: any) => T;
  toSupabase: (row: T) => Record<string, any>;
}

const CACHE_KEY = 'agency_db';

const tableConfig: { [K in PersistedTable]: TableConfig<AppDatabase[K][number] & RowWithId> } = {
  users: {
    supabaseTable: 'users',
    fromSupabase: (u) => ({
      id: u.id,
      name: u.name || '',
      email: u.email || '',
      role: u.role || 'Consulta',
      active: Boolean(u.active),
      canEdit: Boolean(u.can_edit),
    }),
    toSupabase: (u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      active: u.active,
      can_edit: u.canEdit,
    }),
  },
  clients: {
    supabaseTable: 'clients',
    fromSupabase: (c) => ({
      id: c.id,
      name: c.name || '',
      status: c.status || 'Activo',
      dateAdded: c.date_added || '',
      notes: c.notes || '',
    }),
    toSupabase: (c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      date_added: c.dateAdded,
      notes: c.notes,
    }),
  },
  brands: {
    supabaseTable: 'brands',
    fromSupabase: (b) => ({
      id: b.id,
      clientId: b.client_id || '',
      name: b.name || '',
      logo: b.logo || '',
      website: b.website || '',
      notes: b.notes || '',
      accountManager: b.account_manager || '',
      analysts: b.analysts || [],
      cms: b.cms || [],
      brandStrategist: b.brand_strategist || '',
    }),
    toSupabase: (b) => ({
      id: b.id,
      client_id: b.clientId,
      name: b.name,
      logo: b.logo,
      website: b.website,
      notes: b.notes,
      account_manager: b.accountManager,
      analysts: b.analysts || [],
      cms: b.cms || [],
      brand_strategist: b.brandStrategist,
    }),
  },
  socialProfiles: {
    supabaseTable: 'social_profiles',
    fromSupabase: (s) => ({
      id: s.id,
      brandId: s.brand_id || '',
      platform: s.platform || 'Otra',
      username: s.username || '',
      url: s.url || '',
      loginUser: s.login_user || '',
      password: s.password || '',
      passwordDate: s.password_date || '',
      emailLinked: s.email_linked || '',
      phoneLinked: s.phone_linked || '',
      mfaMethod: s.mfa_method || '',
      notes: s.notes || '',
      totpSecret: s.totp_secret || '',
    }),
    toSupabase: (s) => ({
      id: s.id,
      brand_id: s.brandId,
      platform: s.platform,
      username: s.username,
      url: s.url,
      login_user: s.loginUser,
      password: s.password,
      password_date: s.passwordDate,
      email_linked: s.emailLinked,
      phone_linked: s.phoneLinked,
      mfa_method: s.mfaMethod,
      notes: s.notes,
      totp_secret: s.totpSecret,
    }),
  },
  adAccounts: {
    supabaseTable: 'ad_accounts',
    fromSupabase: (a) => ({
      id: a.id,
      brandId: a.brand_id || '',
      platform: a.platform || 'Otra',
      accountId: a.account_id || '',
      user: a.account_user || '',
      email: a.email || '',
      accessLevel: a.access_level || '',
      notes: a.notes || '',
    }),
    toSupabase: (a) => ({
      id: a.id,
      brand_id: a.brandId,
      platform: a.platform,
      account_id: a.accountId,
      account_user: a.user,
      email: a.email,
      access_level: a.accessLevel,
      notes: a.notes,
    }),
  },
  mfaCodes: {
    supabaseTable: 'mfa_codes',
    fromSupabase: (m) => ({
      id: m.id,
      accountId: m.account_id || '',
      code: m.code || '',
      status: m.status || 'Disponible',
      usedBy: m.used_by || '',
      usedDate: m.used_date || '',
      usedTime: m.used_time || '',
    }),
    toSupabase: (m) => ({
      id: m.id,
      account_id: m.accountId,
      code: m.code,
      status: m.status,
      used_by: m.usedBy,
      used_date: m.usedDate,
      used_time: m.usedTime,
    }),
  },
  digitalAssets: {
    supabaseTable: 'digital_assets',
    fromSupabase: (d) => ({
      id: d.id,
      brandId: d.brand_id || '',
      type: d.type || 'Otros',
      name: d.name || '',
      url: d.url || '',
      ownership: d.ownership || 'Cliente',
      status: d.status || 'Desconocido',
      notes: d.notes || '',
    }),
    toSupabase: (d) => ({
      id: d.id,
      brand_id: d.brandId,
      type: d.type,
      name: d.name,
      url: d.url,
      ownership: d.ownership,
      status: d.status,
      notes: d.notes,
    }),
  },
  sharedTools: {
    supabaseTable: 'tools_agency',
    fromSupabase: (t) => ({
      id: t.id,
      name: t.name || '',
      utilidad: t.utilidad || '',
      loginType: t.login_type || 'Correo y Contraseña',
      user: t.user_id_email || '',
      password: t.password || '',
      emailLinked: t.email_linked || '',
      mfaMethod: t.mfa_method || 'Ninguno',
      smsPhone: t.sms_phone || '',
      smsResponsible: t.sms_responsible || '',
      authAppResponsible: t.auth_app_responsible || '',
      authAppEmail: t.auth_app_email || '',
      emailReceiver: t.email_receiver || '',
      notes: t.notes || '',
      passwordDate: t.password_date || '',
      totpSecret: t.totp_secret || '',
    }),
    toSupabase: (t) => ({
      id: t.id,
      name: t.name,
      utilidad: t.utilidad,
      login_type: t.loginType,
      user_id_email: t.user,
      password: t.password,
      email_linked: t.emailLinked,
      mfa_method: t.mfaMethod,
      sms_phone: t.smsPhone,
      sms_responsible: t.smsResponsible,
      auth_app_responsible: t.authAppResponsible,
      auth_app_email: t.authAppEmail,
      email_receiver: t.emailReceiver,
      notes: t.notes,
      password_date: t.passwordDate,
      totp_secret: t.totpSecret,
    }),
  },
  brandLinks: {
    supabaseTable: 'brand_links',
    fromSupabase: (b) => ({
      id: b.id,
      brandId: b.brand_id || '',
      type: b.type || 'Otros',
      name: b.name || '',
      url: b.url || '',
    }),
    toSupabase: (b) => ({
      id: b.id,
      brand_id: b.brandId,
      type: b.type,
      name: b.name,
      url: b.url,
    }),
  },
};

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

function readCache(): AppDatabase {
  const stored = localStorage.getItem(CACHE_KEY);
  if (!stored) return initialData;

  try {
    return { ...initialData, ...JSON.parse(stored) };
  } catch (error) {
    console.error('Error reading local database cache', error);
    return initialData;
  }
}

function writeCache(db: AppDatabase) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(db));
}

function rowsEqual(config: TableConfig<any>, left: RowWithId, right: RowWithId) {
  return JSON.stringify(config.toSupabase(left)) === JSON.stringify(config.toSupabase(right));
}

async function syncTable<K extends PersistedTable>(
  table: K,
  previousRows: AppDatabase[K],
  nextRows: AppDatabase[K]
) {
  const config = tableConfig[table] as TableConfig<RowWithId>;
  const previousById = new Map((previousRows as RowWithId[]).map((row) => [row.id, row]));
  const nextById = new Map((nextRows as RowWithId[]).map((row) => [row.id, row]));

  const deletedIds = [...previousById.keys()].filter((id) => !nextById.has(id));
  const changedRows = [...nextById.values()].filter((row) => {
    const previous = previousById.get(row.id);
    return !previous || !rowsEqual(config, previous, row);
  });

  if (deletedIds.length > 0) {
    const { error } = await supabase.from(config.supabaseTable).delete().in('id', deletedIds);
    if (error) throw error;
  }

  if (changedRows.length > 0) {
    const payload = changedRows.map((row) => config.toSupabase(row));
    const { error } = await supabase.from(config.supabaseTable).upsert(payload);
    if (error) throw error;
  }
}

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<AppDatabase>(initialData);
  const dbRef = useRef(db);
  const { user } = useAuth();
  const currentUserEmail = user?.email || 'Desconocido';

  useEffect(() => {
    dbRef.current = db;
  }, [db]);

  useEffect(() => {
    const fetchSupabaseData = async () => {
      try {
        const persistedEntries = Object.entries(tableConfig) as [PersistedTable, TableConfig<any>][];
        const tableResults = await Promise.all(
          persistedEntries.map(async ([table, config]) => {
            const { data, error } = await supabase.from(config.supabaseTable).select('*');
            if (error) throw error;
            return [table, (data || []).map(config.fromSupabase)] as const;
          })
        );

        const { data: logsData, error: logsError } = await supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (logsError) throw logsError;

        const supabaseDb = tableResults.reduce(
          (acc, [table, rows]) => ({ ...acc, [table]: rows }),
          { ...initialData, changeLogs: [] } as AppDatabase
        );

        supabaseDb.auditLogs = (logsData || []).map((log) => ({
          id: log.id,
          date: log.date,
          time: log.time,
          user: log.user_email,
          action: log.action as AuditLog['action'],
          record: log.record,
          module: log.module,
        }));

        setDb(supabaseDb);
        dbRef.current = supabaseDb;
        writeCache(supabaseDb);
      } catch (error) {
        console.error('Error fetching from Supabase. Falling back to local cache.', error);
        const cachedDb = readCache();
        setDb(cachedDb);
        dbRef.current = cachedDb;
      }
    };

    fetchSupabaseData();
  }, []);

  const updateData = async <K extends PersistedTable>(table: K, data: AppDatabase[K]) => {
    const previousDb = dbRef.current;

    try {
      await syncTable(table, previousDb[table], data);
      const nextDb = { ...previousDb, [table]: data };
      setDb(nextDb);
      dbRef.current = nextDb;
      writeCache(nextDb);
    } catch (error: any) {
      console.error(`Error syncing ${String(table)} with Supabase`, error);
      alert(`No se pudo guardar en Supabase: ${error?.message || 'error desconocido'}`);
      throw error;
    }
  };

  const logAction = async (action: AuditLog['action'], record: string, module: string) => {
    const now = new Date();
    const newLog: AuditLog = {
      id: Math.random().toString(36).substr(2, 9),
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0],
      user: currentUserEmail,
      action,
      record,
      module,
    };

    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .insert([{
          user_email: currentUserEmail,
          action,
          record,
          module,
          date: newLog.date,
          time: newLog.time,
        }])
        .select('*')
        .single();

      if (error) throw error;

      const persistedLog: AuditLog = data ? {
        id: data.id,
        date: data.date,
        time: data.time,
        user: data.user_email,
        action: data.action as AuditLog['action'],
        record: data.record,
        module: data.module,
      } : newLog;

      setDb((prev) => {
        const nextDb = { ...prev, auditLogs: [persistedLog, ...prev.auditLogs] };
        dbRef.current = nextDb;
        writeCache(nextDb);
        return nextDb;
      });
    } catch (error) {
      console.error('Error inserting audit log in Supabase', error);
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
