-- Add audio_url column for voice messages
ALTER TABLE public.messages 
ADD COLUMN audio_url TEXT,
ADD COLUMN audio_duration INTEGER;

-- Create storage bucket for voice messages
INSERT INTO storage.buckets (id, name, public) 
VALUES ('voice-messages', 'voice-messages', true);

-- Storage policies for voice messages
CREATE POLICY "Authenticated users can upload voice messages"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'voice-messages' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Anyone can view voice messages"
ON storage.objects FOR SELECT
USING (bucket_id = 'voice-messages');

CREATE POLICY "Users can delete own voice messages"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'voice-messages' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);