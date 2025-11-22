/**
 * Upload KYC file via PHP backend
 * Files are stored in /uploads/kyc/ directory on the server
 */
export async function uploadKycFile(
  file: File,
  userId: string,
  type: 'id' | 'photo'
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('userId', userId);
  formData.append('type', type);

  const token = localStorage.getItem('auth_token');
  
  const response = await fetch('/api/customer.php?action=upload_kyc', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to upload ${type}`);
  }

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || `Failed to upload ${type}`);
  }

  return result.url;
}

export async function deleteKycFile(url: string): Promise<void> {
  const token = localStorage.getItem('auth_token');
  
  const response = await fetch('/api/customer.php?action=delete_kyc', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ url })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete file');
  }

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to delete file');
  }
}
