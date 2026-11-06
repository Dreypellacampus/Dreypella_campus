/*
# Private reference image storage for Buy orders

1. New storage
- Private bucket `order-references` for reference photos a customer attaches to a Buy order.
- Accepts JPEG, PNG and WebP images up to 5 MB.

2. Security
- The bucket is not public; files are only reachable through signed links.
- Customers can upload only into their own folder (the first path segment must equal their user ID).
- Customers can read only files in their own folder.
- Admins (rows in admin_users) can read any file in the bucket.
- No update or delete policies are added, so uploaded images cannot be overwritten or removed by customers.

3. Notes
- Policies are dropped and recreated first so this migration can be re-run safely.
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'order-references',
  'order-references',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

DROP POLICY IF EXISTS "customers_upload_own_reference_images" ON storage.objects;
CREATE POLICY "customers_upload_own_reference_images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'order-references'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "read_own_or_admin_reference_images" ON storage.objects;
CREATE POLICY "read_own_or_admin_reference_images" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'order-references'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid())
    )
  );
