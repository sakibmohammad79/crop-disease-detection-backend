import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config';
cloudinary.config({
  cloud_name: config.cloudinary.cloudinary_cloud_name,
  api_key: config.cloudinary.cloudinary_api_kay,
  api_secret: config.cloudinary.CLOUDINARY_API_SECRET,
});

// Upload buffer directly to Cloudinary
export const uploadBufferToCloudinary = (buffer: Buffer, folder: string) => {
  return new Promise<any>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `crop-disease/${folder}`,
        resource_type: 'image',
        quality: 'auto', 
        
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
};