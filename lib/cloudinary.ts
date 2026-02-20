import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true,
});

export default cloudinary;

/**
 * Upload a buffer to Cloudinary and return the result.
 */
export async function uploadBufferToCloudinary(
  buffer: Buffer,
  options: {
    publicId?: string;
    folder?: string;
    resourceType?: 'image' | 'video' | 'raw' | 'auto';
  } = {}
): Promise<{ publicId: string; secureUrl: string; bytes: number }> {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      public_id: options.publicId,
      folder: options.folder ?? 'compraser',
      resource_type: (options.resourceType ?? 'auto') as 'image' | 'video' | 'raw' | 'auto',
      type: 'authenticated' as const,
    };

    cloudinary.uploader
      .upload_stream(uploadOptions, (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Cloudinary upload failed'));
          return;
        }
        resolve({
          publicId: result.public_id,
          secureUrl: result.secure_url,
          bytes: result.bytes,
        });
      })
      .end(buffer);
  });
}

/**
 * Generate a signed URL valid for a limited time.
 */
export function generateSignedUrl(
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'raw',
  expiresInSeconds = 3600
): string {
  return cloudinary.utils.private_download_url(publicId, '', {
    resource_type: resourceType,
    expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
    attachment: true,
  });
}

/**
 * Delete an asset from Cloudinary.
 */
export async function deleteCloudinaryAsset(
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'raw'
): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType, type: 'authenticated' });
}
