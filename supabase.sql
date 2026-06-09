-- Script de configuración para Supabase
-- Ejecuta este script en el SQL Editor de tu proyecto en https://supabase.com

-- 1. Crear tabla para registro de auditoría (logs)
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

-- 2. Configurar Row Level Security (RLS) para auditoría
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Permitir a todos (incluyendo anónimos) insertar logs temporalmente o si no hay Auth estricto
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Permitir insertar logs a todos" ON public.audit_logs;
CREATE POLICY "Permitir insertar logs a todos" 
ON public.audit_logs FOR INSERT 
TO public 
WITH CHECK (true);

-- Permitir leer logs
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Permitir ver logs a todos" ON public.audit_logs;
CREATE POLICY "Permitir ver logs a todos" 
ON public.audit_logs FOR SELECT 
TO public 
USING (true);

-- 3. Tabla para guardar roles de usuario (opcional si quieres dar permisos)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios pueden leer a otros usuarios" ON public.users;
CREATE POLICY "Usuarios pueden leer a otros usuarios"
ON public.users FOR SELECT
TO authenticated
USING (true);

-- Automatizar creación de perfil cuando alguien inicia sesión en Supabase
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (new.id, new.email, 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Actualizaciones para el manejo de 2FA / TOTP y Tablas Principales
-- Ejecuta esto en Supabase para crear las tablas si no existen

CREATE TABLE IF NOT EXISTS public.tools_agency (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    utilidad TEXT,
    login_type TEXT,
    user_id_email TEXT,
    password TEXT,
    email_linked TEXT,
    mfa_method TEXT,
    sms_phone TEXT,
    sms_responsible TEXT,
    auth_app_email TEXT,
    email_receiver TEXT,
    notes TEXT,
    password_date TEXT,
    totp_secret TEXT
);

CREATE TABLE IF NOT EXISTS public.instagram (
    id TEXT PRIMARY KEY,
    brand_id TEXT,
    username TEXT,
    login_user TEXT,
    password TEXT,
    password_date TEXT,
    email_linked TEXT,
    phone_linked TEXT,
    mfa_method TEXT,
    auth_email TEXT,
    auth_password TEXT,
    totp_secret TEXT
);

CREATE TABLE IF NOT EXISTS public.tiktok (
    id TEXT PRIMARY KEY,
    brand_id TEXT,
    username TEXT,
    login_user TEXT,
    password TEXT,
    password_date TEXT,
    email_linked TEXT,
    phone_linked TEXT,
    mfa_method TEXT,
    auth_email TEXT,
    auth_password TEXT,
    totp_secret TEXT
);

CREATE TABLE IF NOT EXISTS public.clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT,
    date_added TEXT,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS public.brands (
    id TEXT PRIMARY KEY,
    client_id TEXT,
    name TEXT NOT NULL,
    logo TEXT,
    website TEXT,
    notes TEXT,
    account_manager TEXT,
    analysts TEXT[],
    cms TEXT[],
    brand_strategist TEXT
);

CREATE TABLE IF NOT EXISTS public.meta_business (
    id TEXT PRIMARY KEY,
    brand_id TEXT,
    name TEXT,
    url TEXT,
    account_user TEXT,
    email TEXT,
    access_level TEXT,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS public.meta_ads (
    id TEXT PRIMARY KEY,
    brand_id TEXT,
    name TEXT,
    account_id TEXT,
    account_user TEXT,
    email TEXT,
    access_level TEXT,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS public.tiktok_business (
    id TEXT PRIMARY KEY,
    brand_id TEXT,
    name TEXT,
    account_user TEXT,
    email TEXT,
    access_level TEXT,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS public.tiktok_ads (
    id TEXT PRIMARY KEY,
    brand_id TEXT,
    name TEXT,
    account_id TEXT,
    account_user TEXT,
    email TEXT,
    access_level TEXT,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS public.google_ads (
    id TEXT PRIMARY KEY,
    brand_id TEXT,
    name TEXT,
    account_id TEXT,
    account_user TEXT,
    email TEXT,
    access_level TEXT,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS public.digital_assets (
    id TEXT PRIMARY KEY,
    brand_id TEXT,
    type TEXT,
    name TEXT,
    url TEXT,
    ownership TEXT,
    status TEXT,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS public.brand_links (
    id TEXT PRIMARY KEY,
    brand_id TEXT,
    type TEXT,
    name TEXT,
    url TEXT
);

CREATE TABLE IF NOT EXISTS public.mfa_codes (
    id TEXT PRIMARY KEY,
    account_id TEXT,
    code TEXT,
    status TEXT,
    used_by TEXT,
    used_date TEXT,
    used_time TEXT
);

