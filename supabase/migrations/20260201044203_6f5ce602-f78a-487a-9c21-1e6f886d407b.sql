-- Add show_banner_text column to site_settings
ALTER TABLE public.site_settings
ADD COLUMN show_banner_text boolean NOT NULL DEFAULT true;

-- Create user_management view to help admin manage roles (linking profiles with user_roles)
-- First ensure we have profiles created for all users
CREATE OR REPLACE FUNCTION public.get_all_users_with_roles()
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  avatar_url text,
  role text,
  created_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.user_id,
    p.email,
    p.full_name,
    p.avatar_url,
    COALESCE(ur.role::text, 'user') as role,
    p.created_at
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
  ORDER BY p.created_at DESC
$$;