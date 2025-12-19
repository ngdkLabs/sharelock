-- Create location_history table to store visited locations
CREATE TABLE public.location_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  address TEXT
);

-- Create index for efficient queries
CREATE INDEX idx_location_history_user_id ON public.location_history(user_id);
CREATE INDEX idx_location_history_recorded_at ON public.location_history(recorded_at DESC);

-- Enable RLS
ALTER TABLE public.location_history ENABLE ROW LEVEL SECURITY;

-- Users can insert their own location history
CREATE POLICY "Users can insert own location history"
ON public.location_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own history
CREATE POLICY "Users can view own location history"
ON public.location_history
FOR SELECT
USING (auth.uid() = user_id);

-- Friends can view each other's location history (similar to user_locations policy)
CREATE POLICY "Friends can view location history"
ON public.location_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM friend_connections fc
    WHERE fc.status = 'accepted'
    AND (
      (fc.user_id = auth.uid() AND fc.friend_id = location_history.user_id)
      OR (fc.friend_id = auth.uid() AND fc.user_id = location_history.user_id)
    )
  )
);

-- Users can delete their own history
CREATE POLICY "Users can delete own location history"
ON public.location_history
FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime for location_history
ALTER PUBLICATION supabase_realtime ADD TABLE public.location_history;