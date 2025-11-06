export const CLOUDINARY_CONFIG = {
  cloudName: 'dntotokm',
  uploadPreset: 'escardia_cars',
  idsUploadPreset: 'escardia_ids', // ✅ ADD THIS
};

// ✅ ADD FOLDER PARAMETER
export const uploadToCloudinary = async (
  imageUri: string,
  folder: 'cars' | 'vendor_ids' = 'cars'
): Promise<string> => {
  try {
    const formData = new FormData();
    
    const uriParts = imageUri.split('.');
    const fileType = uriParts[uriParts.length - 1];
    
    formData.append('file', {
      uri: imageUri,
      type: `image/${fileType}`,
      name: `photo.${fileType}`,
    } as any);
    
    // ✅ USE CORRECT PRESET BASED ON FOLDER
    const preset = folder === 'vendor_ids' 
      ? CLOUDINARY_CONFIG.idsUploadPreset 
      : CLOUDINARY_CONFIG.uploadPreset;
    
    formData.append('upload_preset', preset);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();
    
    if (data.secure_url) {
      return data.secure_url;
    } else {
      throw new Error(data.error?.message || 'Failed to upload image');
    }
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};