-- Script para borrar toda la información y empezar de cero
-- ATENCIÓN: Esto borrará permanentemente todos los registros (auditoría, herramientas, etc)
-- excepto el usuario 'alepemu.rd@gmail.com'

-- Desactivar temporalmente los triggers / constraints si es necesario
SET session_replication_role = 'replica';

-- 1. Vaciar las tablas de accesos y redes sociales
TRUNCATE TABLE public.instagram CASCADE;
TRUNCATE TABLE public.tiktok CASCADE;
TRUNCATE TABLE public.facebook_pages CASCADE;
TRUNCATE TABLE public.tools_agency CASCADE;

-- 2. Vaciar el registro de auditoría
TRUNCATE TABLE public.audit_logs CASCADE;

-- 3. Borrar bases de datos faltantes si las hay (clients, brands)
-- TRUNCATE TABLE public.clients CASCADE;
-- TRUNCATE TABLE public.brands CASCADE;

-- 4. Borrar todos los usuarios excepto 'alepemu.rd@gmail.com'
--    Nota: El borrado de 'users' impacta también 'auth.users' de Supabase
--    Aquí borramos solo en public.users
DELETE FROM public.users
WHERE email != 'alepemu.rd@gmail.com';

-- Si deseas también borrarlos del sistema de autenticación de Supabase (auth.users)
-- descomenta y ejecuta esto:
/*
DELETE FROM auth.users 
WHERE email != 'alepemu.rd@gmail.com';
*/

-- Restaurar el comportamiento normal de sesión 
SET session_replication_role = 'origin';

-- Fin del script
