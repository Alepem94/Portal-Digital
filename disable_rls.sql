-- Script para desactivar completamente RLS en todas las tablas

ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tools_agency DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_links DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.mfa_codes DISABLE ROW LEVEL SECURITY;

-- Nota: Si usas auth.users en Supabase, el acceso seguirá manejándose ahí
