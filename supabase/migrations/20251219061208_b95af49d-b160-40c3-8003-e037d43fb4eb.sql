-- Create table for watched locations (geofences)
CREATE TABLE public.location_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  friend_id UUID NOT NULL,
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  radius INTEGER NOT NULL DEFAULT 100, -- radius in meters
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.location_alerts ENABLE ROW LEVEL SECURITY;

-- Users can view their own alerts
CREATE POLICY "Users can view own location alerts"
ON public.location_alerts
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own alerts
CREATE POLICY "Users can create own location alerts"
ON public.location_alerts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own alerts
CREATE POLICY "Users can update own location alerts"
ON public.location_alerts
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own alerts
CREATE POLICY "Users can delete own location alerts"
ON public.location_alerts
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_location_alerts_updated_at
BEFORE UPDATE ON public.location_alerts
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.location_alerts;