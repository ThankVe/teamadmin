
-- Create trigger on auth.users to auto-create profile, role, and team member on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_full_name TEXT;
BEGIN
  user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
  
  -- Create profile (skip if exists)
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, user_full_name)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Assign default user role (skip if exists)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;
  
  -- Create team member entry (skip if exists)
  INSERT INTO public.team_members (user_id, name, email, role, is_active)
  VALUES (NEW.id, user_full_name, NEW.email, 'photographer', true)
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill: create profiles for any existing auth users that don't have one
INSERT INTO public.profiles (user_id, email, full_name)
SELECT u.id, u.email, COALESCE(u.raw_user_meta_data->>'full_name', u.email)
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = u.id);

-- Backfill: create user_roles for any existing auth users that don't have one
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'user'
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id);

-- Backfill: create team_members for any existing auth users that don't have one
INSERT INTO public.team_members (user_id, name, email, role, is_active)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'full_name', u.email), u.email, 'photographer', true
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.user_id = u.id);
