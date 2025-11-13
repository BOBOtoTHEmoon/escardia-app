export const CLOUDINARY_CONFIG = {
  cloudName: 'dntot8okm', 
  uploadPreset: 'escardia_cars',
  idsUploadPreset: 'escardia_ids',
};

export const uploadToCloudinary = async (
  imageUri: string,
  folder: 'cars' | 'vendor_ids' = 'cars'
): Promise<string> => {
  try {
    console.log('🔵 Starting Cloudinary upload...');
    console.log('📁 Folder:', folder);
    console.log('📸 Image URI:', imageUri);
    
    const formData = new FormData();
    
    const uriParts = imageUri.split('.');
    const fileType = uriParts[uriParts.length - 1];
    
    formData.append('file', {
      uri: imageUri,
      type: `image/${fileType}`,
      name: `photo.${fileType}`,
    } as any);
    
    // Use correct preset based on folder
    const preset = folder === 'vendor_ids' 
      ? CLOUDINARY_CONFIG.idsUploadPreset 
      : CLOUDINARY_CONFIG.uploadPreset;
    
    console.log('🔑 Using upload preset:', preset);
    formData.append('upload_preset', preset);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`;
    console.log('🌐 Upload URL:', uploadUrl);

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('📡 Response status:', response.status);
    const data = await response.json();
    console.log('📦 Response data:', data);
    
    if (data.secure_url) {
      console.log('✅ Upload successful!');
      return data.secure_url;
    } else {
      console.error('❌ Upload failed:', data);
      throw new Error(data.error?.message || 'Failed to upload image');
    }
  } catch (error: any) {
    console.error('❌ Cloudinary upload error:', error);
    throw error;
  }
};
