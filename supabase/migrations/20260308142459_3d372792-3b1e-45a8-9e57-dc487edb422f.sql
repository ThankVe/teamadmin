CREATE OR REPLACE FUNCTION public.get_all_users_with_roles()
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  avatar_url text,
  role text,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;
  
  RETURN QUERY
    SELECT 
      p.user_id,
      p.email,
      p.full_name,
      p.avatar_url,
      COALESCE(ur.role::text, 'user') as role,
      p.created_at
    FROM public.profiles p
    LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
    ORDER BY p.created_at DESC;
END;
$$;