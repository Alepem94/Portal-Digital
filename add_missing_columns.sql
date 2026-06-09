ALTER TABLE public.users ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS can_edit BOOLEAN DEFAULT false;

-- De paso, asegurarnos de que el reload de schema suceda
NOTIFY pgrst, 'reload schema';
