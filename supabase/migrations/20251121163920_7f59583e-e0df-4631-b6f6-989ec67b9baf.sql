-- Create storage bucket for KYC documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kyc-assets',
  'kyc-assets',
  false,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf']
);

-- RLS policies for kyc-assets bucket
CREATE POLICY "Users can upload their own KYC documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'kyc-assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own KYC documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'kyc-assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own KYC documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'kyc-assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Add columns to strowallet_customers for document URLs
ALTER TABLE public.strowallet_customers
ADD COLUMN IF NOT EXISTS id_image_url TEXT,
ADD COLUMN IF NOT EXISTS user_photo_url TEXT;

-- Create index on card status for better performance
CREATE INDEX IF NOT EXISTS idx_strowallet_cards_status ON public.strowallet_cards(status);