-- Create trigger to sync profile updates to team_members
CREATE OR REPLACE FUNCTION public.sync_profile_to_team_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update team_member with profile data
  UPDATE public.team_members
  SET 
    name = COALESCE(NEW.full_name, NEW.email),
    email = NEW.email,
    avatar_url = NEW.avatar_url,
    updated_at = now()
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_to_team_member();

-- Sync existing data from profiles to team_members
UPDATE public.team_members tm
SET 
  name = COALESCE(p.full_name, p.email),
  avatar_url = p.avatar_url,
  updated_at = now()
FROM public.profiles p
WHERE tm.user_id = p.user_id;