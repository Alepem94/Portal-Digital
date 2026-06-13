import { createClient } from '@supabase/supabase-js';
import type { IncomingMessage, ServerResponse } from 'http';
import { randomUUID } from 'crypto';

type AppRole = 'admin' | 'member';

const ADMIN_PERMISSIONS = {
  canManageUsers: true,
  canEditAccounts: true,
  canManageTools: true,
  canViewCredentials: true,
  canRevealCredentials: true,
  canViewFinance: true,
  canEditFinance: true,
};

function getEnv(name: string) {
  return process.env[name] || '';
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let rawBody = '';
    req.on('data', (chunk) => {
      rawBody += chunk;
    });
    req.on('end', () => {
      try {
        resolve(rawBody ? JSON.parse(rawBody) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeRole(appRole?: string): AppRole {
  return appRole === 'admin' ? 'admin' : 'member';
}

function isAdminUser(userRow: any) {
  const role = (userRow?.role || '').toLowerCase();
  return (
    userRow?.app_role === 'admin' ||
    role === 'administrador' ||
    role === 'head de medios digitales' ||
    role.includes('admin') ||
    userRow?.permissions?.canManageUsers === true
  );
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST' && req.method !== 'DELETE') {
    send(res, 405, { error: 'Method not allowed' });
    return;
  }

  const supabaseUrl = getEnv('SUPABASE_URL') || getEnv('VITE_SUPABASE_URL');
  const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY') || getEnv('VITE_SUPABASE_ANON_KEY');
  const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    send(res, 500, { error: 'Missing Supabase server configuration' });
    return;
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : '';

  if (!token) {
    send(res, 401, { error: 'Missing bearer token' });
    return;
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: authData, error: authError } = await userClient.auth.getUser();
  if (authError || !authData.user?.email) {
    send(res, 401, { error: 'Invalid session' });
    return;
  }

  const callerEmail = normalizeEmail(authData.user.email);
  const { data: caller, error: callerError } = await adminClient
    .from('users')
    .select('email, role, app_role, permissions, active')
    .ilike('email', callerEmail)
    .single();

  if (callerError || !caller || caller.active !== true || !isAdminUser(caller)) {
    send(res, 403, { error: 'Admin permission required' });
    return;
  }

  try {
    const body = await readBody(req);
    const email = normalizeEmail(body.email || '');

    if (!email) {
      send(res, 400, { error: 'Email is required' });
      return;
    }

    if (req.method === 'DELETE') {
      await adminClient.from('whitelist').delete().eq('email', email);
      const { data, error } = await adminClient
        .from('users')
        .update({ active: false })
        .eq('email', email)
        .select('*')
        .single();

      if (error) throw error;
      send(res, 200, { user: data });
      return;
    }

    const appRole = normalizeRole(body.appRole);
    const permissions = appRole === 'admin' ? ADMIN_PERMISSIONS : (body.permissions || {});
    const name = String(body.name || '').trim();

    await adminClient.from('whitelist').upsert([{ email }], { onConflict: 'email' });

    const { data: existingUser } = await adminClient
      .from('users')
      .select('id')
      .ilike('email', email)
      .maybeSingle();

    const userPayload = {
      id: body.id || existingUser?.id || `usr_${randomUUID()}`,
      email,
      name,
      role: appRole === 'admin' ? 'Administrador' : 'Miembro',
      app_role: appRole,
      permissions,
      active: body.active !== false,
      can_edit: permissions.canEditAccounts === true || permissions.canManageTools === true,
    };

    const { data, error } = await adminClient
      .from('users')
      .upsert([userPayload], { onConflict: 'email' })
      .select('*')
      .single();

    if (error) throw error;

    send(res, 200, { user: data });
  } catch (error: any) {
    send(res, 500, { error: error?.message || 'Unexpected error' });
  }
}
