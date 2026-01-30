-- Fix: allow new statuses used by the app (acknowledged/in_progress)
-- Current error: violates check constraint "events_status_check"

ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_status_check;

ALTER TABLE public.events
  ADD CONSTRAINT events_status_check
  CHECK (
    status IN (
      'acknowledged',
      'in_progress',
      'completed',
      'cancelled',
      -- legacy/backward-compatible values
      'pending',
      'confirmed'
    )
  );

ALTER TABLE public.events
  ALTER COLUMN status SET DEFAULT 'acknowledged';
