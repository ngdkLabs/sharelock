-- Update storage policy to restrict file types (only allow jpg, jpeg, png, webp)
DROP POLICY IF EXISTS "Users can upload avatar" ON storage.objects;

CREATE POLICY "Users can upload avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND (
      LOWER(name) LIKE '%.jpg' 
      OR LOWER(name) LIKE '%.jpeg' 
      OR LOWER(name) LIKE '%.png' 
      OR LOWER(name) LIKE '%.webp'
    )
  );

-- Add update policy for avatars
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;

CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Add delete policy for avatars
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;

CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );