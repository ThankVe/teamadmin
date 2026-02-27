
-- ============================================
-- Fix ALL restrictive policies across ALL tables
-- PostgreSQL requires at least 1 PERMISSIVE policy per command
-- ============================================

-- ========== events ==========
DROP POLICY IF EXISTS "Events are viewable by everyone" ON public.events;
DROP POLICY IF EXISTS "Admins and editors can insert events" ON public.events;
DROP POLICY IF EXISTS "Admins and editors can update events" ON public.events;
DROP POLICY IF EXISTS "Admins can delete events" ON public.events;

CREATE POLICY "Events are viewable by everyone" ON public.events FOR SELECT USING (true);
CREATE POLICY "Admins and editors can insert events" ON public.events FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));
CREATE POLICY "Admins and editors can update events" ON public.events FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));
CREATE POLICY "Admins can delete events" ON public.events FOR DELETE TO authenticated USING (public.is_admin());

-- ========== event_photographers ==========
DROP POLICY IF EXISTS "Event photographers are viewable by everyone" ON public.event_photographers;
DROP POLICY IF EXISTS "Admins and editors can manage event photographers" ON public.event_photographers;

CREATE POLICY "Event photographers are viewable by everyone" ON public.event_photographers FOR SELECT USING (true);
CREATE POLICY "Admins and editors can manage event photographers" ON public.event_photographers FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

-- ========== notifications ==========
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;

CREATE POLICY "Admins and editors can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notifications" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ========== event_categories ==========
DROP POLICY IF EXISTS "Event categories are viewable by everyone" ON public.event_categories;
DROP POLICY IF EXISTS "Admins can insert event categories" ON public.event_categories;
DROP POLICY IF EXISTS "Admins can update event categories" ON public.event_categories;
DROP POLICY IF EXISTS "Admins can delete event categories" ON public.event_categories;

CREATE POLICY "Event categories are viewable by everyone" ON public.event_categories FOR SELECT USING (true);
CREATE POLICY "Admins can insert event categories" ON public.event_categories FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update event categories" ON public.event_categories FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete event categories" ON public.event_categories FOR DELETE TO authenticated USING (public.is_admin());

-- ========== team_members ==========
DROP POLICY IF EXISTS "Team members are viewable by everyone" ON public.team_members;
DROP POLICY IF EXISTS "Admins can insert team members" ON public.team_members;
DROP POLICY IF EXISTS "Admins can update team members" ON public.team_members;
DROP POLICY IF EXISTS "Admins can delete team members" ON public.team_members;

CREATE POLICY "Team members are viewable by everyone" ON public.team_members FOR SELECT USING (true);
CREATE POLICY "Admins can insert team members" ON public.team_members FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update team members" ON public.team_members FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete team members" ON public.team_members FOR DELETE TO authenticated USING (public.is_admin());

-- ========== profiles ==========
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ========== site_settings ==========
DROP POLICY IF EXISTS "Site settings are viewable by everyone" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can update site settings" ON public.site_settings;

CREATE POLICY "Site settings are viewable by everyone" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update site settings" ON public.site_settings FOR UPDATE TO authenticated USING (public.is_admin());

-- ========== telegram_groups ==========
DROP POLICY IF EXISTS "Telegram groups are viewable by admins" ON public.telegram_groups;
DROP POLICY IF EXISTS "Admins can insert telegram groups" ON public.telegram_groups;
DROP POLICY IF EXISTS "Admins can update telegram groups" ON public.telegram_groups;
DROP POLICY IF EXISTS "Admins can delete telegram groups" ON public.telegram_groups;

CREATE POLICY "Telegram groups are viewable by admins" ON public.telegram_groups FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can insert telegram groups" ON public.telegram_groups FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update telegram groups" ON public.telegram_groups FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete telegram groups" ON public.telegram_groups FOR DELETE TO authenticated USING (public.is_admin());

-- ========== Enable realtime on user_roles ==========
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
