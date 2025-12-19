-- Add SOS alarm setting to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS sos_alarm_enabled boolean NOT NULL DEFAULT true;