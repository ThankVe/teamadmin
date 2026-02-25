
-- Allow editors to manage event photographers
DROP POLICY IF EXISTS "Admins can manage event photographers" ON public.event_photographers;
CREATE POLICY "Admins and editors can manage event photographers"
ON public.event_photographers
FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));
