-- Step 2: Update RLS policies for events to allow editors

-- Update RLS policy for events to allow editors to insert
DROP POLICY IF EXISTS "Authenticated users can insert events" ON public.events;
CREATE POLICY "Admins and editors can insert events" 
ON public.events 
FOR INSERT 
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor')
);

-- Update RLS policy for events to allow editors to update
DROP POLICY IF EXISTS "Admins can update events" ON public.events;
CREATE POLICY "Admins and editors can update events" 
ON public.events 
FOR UPDATE 
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor')
);