-- Script de configuración para Supabase
-- Ejecuta este script en el SQL Editor de tu proyecto en https://supabase.com

-- 1. Crear tabla para registro de auditoría (logs)
CREATE TABLE public.audit_logs (
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

-- Permitir a usuarios autenticados insertar logs
CREATE POLICY "Usuarios autenticados pueden insertar logs" 
ON public.audit_logs FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Permitir a usuarios leer logs
CREATE POLICY "Usuarios autenticados pueden ver logs" 
ON public.audit_logs FOR SELECT 
TO authenticated 
USING (true);

-- 3. Tabla para guardar roles de usuario (opcional si quieres dar permisos)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

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
    password TEXT,
    password_date TEXT,
    email_linked TEXT,
    phone_linked TEXT,
    mfa_method TEXT,
    auth_email TEXT,
    auth_password TEXT,
    totp_secret TEXT
);

CREATE TABLE IF NOT EXISTS public.facebook_pages (
    id TEXT PRIMARY KEY,
    brand_id TEXT,
    page_name TEXT,
    url TEXT,
    page_id TEXT,
    notes TEXT,
    totp_secret TEXT
);

