/*
# Storage Bucket for Profile Photos

## Overview
Creates a storage bucket for user profile photos with public read access.
Users can only upload/delete their own photos.

## Changes
1. Storage bucket 'profiles' for profile photos
2. Public read policy for all users
3. Authenticated users can upload to their own folder
4. Authenticated users can delete their own files

## Security
- Public bucket for reading
- Users can only manage files in their own directory (user_id/avatar.*)
- Max file size handled at application level (2MB)
*/

-- Create storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profiles',
  'profiles',
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Policy: Allow public read access to all profile photos
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profiles');

-- Policy: Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload own photo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profiles'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to update their own photos
CREATE POLICY "Users can update own photo"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profiles'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to delete their own photos
CREATE POLICY "Users can delete own photo"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profiles'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Update handle_new_user function to handle Google OAuth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert profile, getting nome from metadata (for Google OAuth) or email
  INSERT INTO public.profiles (id, nome, email, foto_perfil)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'nome',
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
