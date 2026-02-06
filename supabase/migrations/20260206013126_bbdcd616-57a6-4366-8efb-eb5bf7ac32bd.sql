-- Add daily_reminder_time column to site_settings table
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS daily_reminder_time TIME DEFAULT '07:00:00';

-- Add comment for clarity
COMMENT ON COLUMN public.site_settings.daily_reminder_time IS 'Time for daily Telegram event reminder in Thailand timezone (UTC+7)';