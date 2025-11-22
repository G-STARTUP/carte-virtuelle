import { supabase } from "@/integrations/supabase/client";

export async function uploadKycFile(
  file: File,
  userId: string,
  type: 'id' | 'photo'
): Promise<string> {
  const ext = file.name.split('.').pop();
  const timestamp = Date.now();
  const path = `${userId}/${type}-${timestamp}.${ext}`;

  // Upload file to storage
  const { error: uploadError } = await supabase.storage
    .from('kyc-assets')
    .upload(path, file, {
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    throw new Error(`Failed to upload ${type}: ${uploadError.message}`);
  }

  // Get public URL instead of signed URL for Strowallet API access
  const { data: publicUrlData } = supabase.storage
    .from('kyc-assets')
    .getPublicUrl(path);

  if (!publicUrlData) {
    throw new Error(`Failed to get public URL for ${type}`);
  }

  return publicUrlData.publicUrl;
}

export async function deleteKycFile(url: string): Promise<void> {
  // Extract path from signed URL
  const urlObj = new URL(url);
  const pathMatch = urlObj.pathname.match(/\/kyc-assets\/(.+?)(?:\?|$)/);
  
  if (!pathMatch) {
    throw new Error('Invalid URL format');
  }

  const path = pathMatch[1];

  const { error } = await supabase.storage
    .from('kyc-assets')
    .remove([path]);

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}
