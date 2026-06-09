DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user;
DROP TABLE IF EXISTS public.users CASCADE;

CREATE TABLE public.users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT,
    active BOOLEAN DEFAULT true,
    can_edit BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access users" ON public.users FOR ALL USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, role, name, active, can_edit)
  VALUES (new.id::text, new.email, 'Consulta', new.raw_user_meta_data->>'full_name', true, false)
  ON CONFLICT (email) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
