-- Tighten team_members SELECT: admins/editors see all, regular users only see name and avatar
DROP POLICY IF EXISTS "Team members are viewable by authenticated users" ON public.team_members;

-- Admins and editors can view all team member data
CREATE POLICY "Admins and editors can view all team members"
  ON public.team_members
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor')
  );

-- Regular users can only see their own team member entry
CREATE POLICY "Users can view own team member entry"
  ON public.team_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());