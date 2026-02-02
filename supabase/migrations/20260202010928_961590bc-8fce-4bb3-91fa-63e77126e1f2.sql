-- Add user_id column to team_members to link with auth.users
ALTER TABLE public.team_members 
ADD COLUMN IF NOT EXISTS user_id uuid UNIQUE;

-- Update handle_new_user function to also create team member
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_full_name TEXT;
BEGIN
  -- Get full name from metadata or use email
  user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
  
  -- Create profile
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, user_full_name);
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Create team member entry
  INSERT INTO public.team_members (user_id, name, email, role, is_active)
  VALUES (NEW.id, user_full_name, NEW.email, 'photographer', true);
  
  RETURN NEW;
END;
$$;

-- Backfill: Create team_members entries for existing users who don't have one
INSERT INTO public.team_members (user_id, name, email, role, is_active)
SELECT 
  p.user_id,
  COALESCE(p.full_name, p.email),
  p.email,
  'photographer',
  true
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_members tm WHERE tm.user_id = p.user_id
)
AND NOT EXISTS (
  SELECT 1 FROM public.team_members tm WHERE tm.email = p.email
);