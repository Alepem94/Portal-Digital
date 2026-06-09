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

-- Actualizaciones para el manejo de 2FA / TOTP 
-- Ejecutar estas alteraciones si ya existen las tablas:

-- ALTER TABLE public.tools_agency ADD COLUMN IF NOT EXISTS totp_secret TEXT;
-- ALTER TABLE public.instagram ADD COLUMN IF NOT EXISTS totp_secret TEXT;
-- ALTER TABLE public.tiktok ADD COLUMN IF NOT EXISTS totp_secret TEXT;
-- ALTER TABLE public.facebook_pages ADD COLUMN IF NOT EXISTS totp_secret TEXT;

