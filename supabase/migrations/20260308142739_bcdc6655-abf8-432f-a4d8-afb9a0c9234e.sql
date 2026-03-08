-- Fix team_members: restrict SELECT to authenticated users only
DROP POLICY IF EXISTS "Team members are viewable by everyone" ON public.team_members;
CREATE POLICY "Team members are viewable by authenticated users"
  ON public.team_members
  FOR SELECT
  TO authenticated
  USING (true);

-- Fix profiles: restrict SELECT to own profile or admin
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Users can view own profile or admins can view all"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());