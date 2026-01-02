-- Add autopilot and WordPress credentials to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS wp_url TEXT,
ADD COLUMN IF NOT EXISTS wp_username TEXT,
ADD COLUMN IF NOT EXISTS wp_app_password TEXT,
ADD COLUMN IF NOT EXISTS autopilot_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS autopilot_time TEXT DEFAULT '09:00';

-- Add content field to content_briefs if not exists  
ALTER TABLE public.content_briefs
ADD COLUMN IF NOT EXISTS outline TEXT,
ADD COLUMN IF NOT EXISTS meta_description TEXT;