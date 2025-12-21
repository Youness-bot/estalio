-- ================================================================
-- PROPERTY IMAGES STORAGE BUCKET SETUP
-- Create public storage bucket for property images
-- ================================================================

-- Create public bucket for property images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'property-images',
    'property-images',
    true,  -- PUBLIC bucket - images are viewable by anyone
    10485760, -- 10MB limit per file
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- ================================================================
-- RLS POLICIES FOR PROPERTY IMAGES BUCKET
-- ================================================================

-- Allow anyone to view property images (public bucket)
CREATE POLICY "public_view_property_images" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'property-images');

-- Allow authenticated users to upload property images
CREATE POLICY "authenticated_upload_property_images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'property-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own property images
CREATE POLICY "users_update_own_property_images" ON storage.objects
FOR UPDATE TO authenticated
USING (
    bucket_id = 'property-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'property-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own property images
CREATE POLICY "users_delete_own_property_images" ON storage.objects
FOR DELETE TO authenticated
USING (
    bucket_id = 'property-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
);