import { v2 as cloudinary } from 'cloudinary';
import { logger } from '../utils/logger.js';
import fs from 'fs';

const isCloudinaryConfigured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  logger.info('Cloudinary SDK configured successfully.');
} else {
  logger.info('Cloudinary credentials not provided. File uploads will be served via local static storage.');
}

export const uploadMediaToCloud = async (localFilePath, folder = 'intellmeet/avatars') => {
  try {
    if (!localFilePath) return null;

    if (isCloudinaryConfigured) {
      const response = await cloudinary.uploader.upload(localFilePath, {
        resource_type: 'auto',
        folder: folder,
      });

      // Cleanup local temp file
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }

      return {
        url: response.secure_url,
        publicId: response.public_id,
      };
    } else {
      // Local fallback url
      const fileName = localFilePath.replace(/\\/g, '/').split('/').pop();
      return {
        url: `/uploads/${fileName}`,
        publicId: fileName,
      };
    }
  } catch (error) {
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    logger.error(`Media upload error: ${error.message}`);
    throw error;
  }
};

export default cloudinary;
