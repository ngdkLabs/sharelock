-- Create typing_status table for real-time typing indicators
CREATE TABLE public.typing_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  friend_id UUID NOT NULL,
  is_typing BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- Enable RLS
ALTER TABLE public.typing_status ENABLE ROW LEVEL SECURITY;

-- Users can manage their own typing status
CREATE POLICY "Users can insert own typing status"
ON public.typing_status FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own typing status"
ON public.typing_status FOR UPDATE
USING (auth.uid() = user_id);

-- Users can view typing status from friends
CREATE POLICY "Users can view friend typing status"
ON public.typing_status FOR SELECT
USING (auth.uid() = friend_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_status;

-- Add reply columns to messages table
ALTER TABLE public.messages
ADD COLUMN reply_to_id UUID REFERENCES public.messages(id),
ADD COLUMN reply_to_content TEXT,
ADD COLUMN reply_to_sender_name TEXT;