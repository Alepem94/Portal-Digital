-- 1. Tabla de Usuarios (Permisos/Roles)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Analista',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Políticas para users: Todos los usuarios autenticados pueden leer la lista
CREATE POLICY "Permitir lectura de todos los usuarios" ON public.users
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policies para inserts/updates si prefieres que se pueda modificar desde la app web
CREATE POLICY "Permitir insertar usuarios a todos los autenticados" ON public.users
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    
CREATE POLICY "Permitir actualizar usuarios a todos los autenticados" ON public.users
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir eliminar usuarios a todos los autenticados" ON public.users
    FOR DELETE USING (auth.role() = 'authenticated');

-- 2. Tabla de Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    action TEXT NOT NULL,
    record TEXT NOT NULL,
    module TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para audit_logs
CREATE POLICY "Permitir lectura de audit_logs" ON public.audit_logs
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir insercion en audit_logs" ON public.audit_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- NOTA: Las demás tablas (clients, brands, meta_business, etc.) pueden crearse de modo similar.
-- En este prototipo se apoyan en Supabase o en Mock Local Storage según lo diseñado en la DB context.
