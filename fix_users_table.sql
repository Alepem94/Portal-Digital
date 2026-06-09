-- Script para permitir guardar IDs que no coincidan con auth.users

-- 1. Intentamos quitar la llave foránea
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- 2. Cambiamos el tipo de la columna a texto para que acepte "usr_1234"
ALTER TABLE public.users ALTER COLUMN id TYPE TEXT;
