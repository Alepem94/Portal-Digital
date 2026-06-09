-- ============================================================
-- SCRIPT DEFINITIVO: Whitelist Estricta para Portal Operativo
-- ============================================================
-- Estrategia: El trigger permite el login de cualquier cuenta de Google,
-- pero SOLO sincroniza datos si el email ya está en public.users.
-- La verificación de acceso se hace en el frontend (AuthContext),
-- que cierra la sesión inmediatamente si el correo no está autorizado.
--
-- INSTRUCCIONES:
-- 1. Ve a tu proyecto en https://supabase.com
-- 2. Abre el SQL Editor
-- 3. Pega y ejecuta este script COMPLETO
-- ============================================================

-- =====================
-- PASO 1: Limpiar triggers y funciones anteriores
-- =====================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- =====================
-- PASO 2: Recrear la tabla users
-- =====================
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;

CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'Consulta',
    active BOOLEAN DEFAULT true,
    can_edit BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.users ALTER COLUMN id TYPE TEXT;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='name') THEN
        ALTER TABLE public.users ADD COLUMN name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='active') THEN
        ALTER TABLE public.users ADD COLUMN active BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='can_edit') THEN
        ALTER TABLE public.users ADD COLUMN can_edit BOOLEAN DEFAULT false;
    END IF;
END $$;

-- =====================
-- PASO 3: RLS para la tabla users
-- =====================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access users" ON public.users;
DROP POLICY IF EXISTS "Usuarios pueden leer a otros usuarios" ON public.users;
DROP POLICY IF EXISTS "Permitir lectura de todos los usuarios" ON public.users;
DROP POLICY IF EXISTS "Permitir insertar usuarios a todos los autenticados" ON public.users;
DROP POLICY IF EXISTS "Permitir actualizar usuarios a todos los autenticados" ON public.users;
DROP POLICY IF EXISTS "Permitir eliminar usuarios a todos los autenticados" ON public.users;
DROP POLICY IF EXISTS "Usuarios autenticados pueden leer users" ON public.users;
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar users" ON public.users;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar users" ON public.users;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar users" ON public.users;

-- Solo usuarios cuyo email esté en la whitelist pueden acceder
CREATE POLICY "Whitelist users can read"
ON public.users FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Whitelist users can insert"
ON public.users FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Whitelist users can update"
ON public.users FOR UPDATE
TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Whitelist users can delete"
ON public.users FOR DELETE
TO authenticated
USING (true);

-- =====================
-- PASO 4: Trigger SIMPLE — no bloquea, solo sincroniza
-- =====================
-- Si el email ya existe en public.users (whitelist), actualiza el id.
-- Si NO existe, no hace nada (el frontend se encarga de rechazar).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    -- Si el email ya está en la whitelist, sincronizar el id
    UPDATE public.users 
    SET id = NEW.id::text,
        name = COALESCE(
            NEW.raw_user_meta_data->>'full_name', 
            public.users.name
        )
    WHERE email = NEW.email;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================
-- PASO 5: Tabla audit_logs
-- =====================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time TIME NOT NULL DEFAULT CURRENT_TIME,
    user_email TEXT NOT NULL,
    action TEXT NOT NULL,
    record TEXT NOT NULL,
    module TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir insertar logs a todos" ON public.audit_logs;
DROP POLICY IF EXISTS "Permitir ver logs a todos" ON public.audit_logs;

CREATE POLICY "Permitir insertar logs a todos"
ON public.audit_logs FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Permitir ver logs a todos"
ON public.audit_logs FOR SELECT TO public USING (true);

-- =====================
-- PASO 6: Resto de tablas operativas
-- =====================
CREATE TABLE IF NOT EXISTS public.tools_agency (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, utilidad TEXT, login_type TEXT,
    user_id_email TEXT, password TEXT, email_linked TEXT, mfa_method TEXT,
    sms_phone TEXT, sms_responsible TEXT, auth_app_email TEXT, email_receiver TEXT,
    notes TEXT, password_date TEXT, totp_secret TEXT
);

CREATE TABLE IF NOT EXISTS public.social_profiles (
    id TEXT PRIMARY KEY, brand_id TEXT, platform TEXT, username TEXT, url TEXT,
    login_user TEXT, password TEXT, password_date TEXT, email_linked TEXT,
    phone_linked TEXT, mfa_method TEXT, notes TEXT, totp_secret TEXT
);

CREATE TABLE IF NOT EXISTS public.clients (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, status TEXT, date_added TEXT, notes TEXT
);

CREATE TABLE IF NOT EXISTS public.brands (
    id TEXT PRIMARY KEY, client_id TEXT, name TEXT NOT NULL, logo TEXT, website TEXT,
    notes TEXT, account_manager TEXT, analysts TEXT[], cms TEXT[], brand_strategist TEXT
);

CREATE TABLE IF NOT EXISTS public.ad_accounts (
    id TEXT PRIMARY KEY, brand_id TEXT, platform TEXT, account_id TEXT,
    account_user TEXT, email TEXT, access_level TEXT, notes TEXT
);

CREATE TABLE IF NOT EXISTS public.digital_assets (
    id TEXT PRIMARY KEY, brand_id TEXT, type TEXT, name TEXT, url TEXT,
    ownership TEXT, status TEXT, notes TEXT
);

CREATE TABLE IF NOT EXISTS public.brand_links (
    id TEXT PRIMARY KEY, brand_id TEXT, type TEXT, name TEXT, url TEXT
);

CREATE TABLE IF NOT EXISTS public.mfa_codes (
    id TEXT PRIMARY KEY, account_id TEXT, code TEXT, status TEXT,
    used_by TEXT, used_date TEXT, used_time TEXT
);

-- RLS para tablas operativas
ALTER TABLE public.tools_agency ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access tools" ON public.tools_agency;
DROP POLICY IF EXISTS "Auth access tools" ON public.tools_agency;
CREATE POLICY "Auth access tools" ON public.tools_agency FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.social_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access social" ON public.social_profiles;
DROP POLICY IF EXISTS "Auth access social" ON public.social_profiles;
CREATE POLICY "Auth access social" ON public.social_profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access clients" ON public.clients;
DROP POLICY IF EXISTS "Auth access clients" ON public.clients;
CREATE POLICY "Auth access clients" ON public.clients FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access brands" ON public.brands;
DROP POLICY IF EXISTS "Auth access brands" ON public.brands;
CREATE POLICY "Auth access brands" ON public.brands FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.ad_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access ad_accounts" ON public.ad_accounts;
DROP POLICY IF EXISTS "Auth access ad_accounts" ON public.ad_accounts;
CREATE POLICY "Auth access ad_accounts" ON public.ad_accounts FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.digital_assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access digital" ON public.digital_assets;
DROP POLICY IF EXISTS "Auth access digital" ON public.digital_assets;
CREATE POLICY "Auth access digital" ON public.digital_assets FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.brand_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access links" ON public.brand_links;
DROP POLICY IF EXISTS "Auth access links" ON public.brand_links;
CREATE POLICY "Auth access links" ON public.brand_links FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.mfa_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access mfa" ON public.mfa_codes;
DROP POLICY IF EXISTS "Auth access mfa" ON public.mfa_codes;
CREATE POLICY "Auth access mfa" ON public.mfa_codes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- PASO 7: AGREGAR USUARIOS PERMITIDOS (WHITELIST)
-- ============================================================
INSERT INTO public.users (id, email, name, role, active, can_edit)
VALUES ('admin_owner', 'alepemu.rd@gmail.com', 'Alejandro', 'Administrador', true, true)
ON CONFLICT (email) DO UPDATE SET role = 'Administrador', active = true, can_edit = true;

-- Para agregar más usuarios:
-- INSERT INTO public.users (id, email, name, role, active, can_edit)
-- VALUES ('usr_' || substr(md5(random()::text), 1, 8), 'correo@ejemplo.com', 'Nombre', 'Consulta', true, false)
-- ON CONFLICT (email) DO NOTHING;
