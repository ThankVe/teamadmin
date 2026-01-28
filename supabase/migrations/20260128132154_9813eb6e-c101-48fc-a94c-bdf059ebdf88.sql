-- Create event categories table
CREATE TABLE public.event_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  requirements TEXT, -- สิ่งที่ต้องการในงาน เช่น ควรถ่ายใครเป็นหลัก
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies for event_categories
CREATE POLICY "Event categories are viewable by everyone"
ON public.event_categories FOR SELECT
USING (true);

CREATE POLICY "Admins can insert event categories"
ON public.event_categories FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Admins can update event categories"
ON public.event_categories FOR UPDATE
USING (is_admin());

CREATE POLICY "Admins can delete event categories"
ON public.event_categories FOR DELETE
USING (is_admin());

-- Add trigger for updated_at
CREATE TRIGGER update_event_categories_updated_at
BEFORE UPDATE ON public.event_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add new columns to events table
ALTER TABLE public.events
ADD COLUMN category_id UUID REFERENCES public.event_categories(id),
ADD COLUMN equipment TEXT, -- อุปกรณ์ที่ต้องนำไป
ADD COLUMN shooting_focus TEXT, -- รายละเอียดงาน เน้นถ่ายอะไร
ADD COLUMN additional_details TEXT; -- รายละเอียดเพิ่มเติม

-- Update status default to 'acknowledged' (รับทราบงาน)
ALTER TABLE public.events
ALTER COLUMN status SET DEFAULT 'acknowledged';

-- Insert default categories
INSERT INTO public.event_categories (name, description, requirements) VALUES
('งานถ่ายภาพอย่างเดียว', 'งานที่ต้องการเฉพาะการถ่ายภาพนิ่ง', 'ถ่ายภาพนิ่งเป็นหลัก'),
('งานถ่ายภาพ + วิดีโอ', 'งานที่ต้องการทั้งภาพนิ่งและวิดีโอ', 'ถ่ายภาพนิ่งและวิดีโอ');