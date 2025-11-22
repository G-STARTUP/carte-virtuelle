-- Rendre le bucket kyc-assets public pour que Strowallet puisse accéder aux images
UPDATE storage.buckets 
SET public = true 
WHERE id = 'kyc-assets';

-- Créer une politique pour permettre l'accès public en lecture
CREATE POLICY "Allow public read access to KYC files"
ON storage.objects FOR SELECT
USING (bucket_id = 'kyc-assets');

-- Créer une politique pour permettre l'upload aux utilisateurs authentifiés
CREATE POLICY "Allow authenticated users to upload their own KYC files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'kyc-assets' AND
  auth.uid()::text = (storage.foldername(name))[1]
);