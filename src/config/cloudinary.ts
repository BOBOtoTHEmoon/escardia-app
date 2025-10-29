export const CLOUDINARY_CONFIG = {
  cloudName: 'dntot8okm',
  uploadPreset: 'escardia_cars',
};

export const uploadToCloudinary = async (imageUri: string): Promise<string> => {
  try {
    const formData = new FormData();
    
    // Get the file extension from URI
    const uriParts = imageUri.split('.');
    const fileType = uriParts[uriParts.length - 1];
    
    formData.append('file', {
      uri: imageUri,
      type: `image/${fileType}`,
      name: `photo.${fileType}`,
    } as any);
    
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);

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