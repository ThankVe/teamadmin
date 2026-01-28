-- Create telegram_groups table for multiple group notifications
CREATE TABLE public.telegram_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  chat_id TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.telegram_groups ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Telegram groups are viewable by admins"
  ON public.telegram_groups FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert telegram groups"
  ON public.telegram_groups FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update telegram groups"
  ON public.telegram_groups FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete telegram groups"
  ON public.telegram_groups FOR DELETE
  USING (is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_telegram_groups_updated_at
  BEFORE UPDATE ON public.telegram_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();