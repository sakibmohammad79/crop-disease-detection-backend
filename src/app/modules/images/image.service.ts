import sharp from 'sharp';
import fs from 'fs/promises';
import crypto from 'crypto';
import httpStatus from 'http-status';
import { v2 as cloudinary } from 'cloudinary';
import { AppError } from '../../errors/AppError';
import { PrismaClient, ProcessingStatus } from '../../../generated/prisma';
import { config } from '../../config';

const prisma = new PrismaClient();

//Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudinary_cloud_name,
  api_key: config.cloudinary.cloudinary_api_kay,
  api_secret: config.cloudinary.CLOUDINARY_API_SECRET,
});

// Helper: Upload buffer directly to Cloudinary
const uploadBufferToCloudinary = (buffer: Buffer, folder: string) => {
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


const uploadImage = async (file: Express.Multer.File, userId: string) => {
  if (!file) {
    throw new AppError(httpStatus.BAD_REQUEST, 'No file uploaded');
  }

  try {
    // Get image metadata
    const metadata = await sharp(file.path).metadata();

    // Create processed image (512x512)
    const processedBuffer = await sharp(file.path)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .jpeg({ quality: 90 })
      .toBuffer();

    // Create thumbnail (150x150)
    const thumbnailBuffer = await sharp(file.path)
      .resize(150, 150, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Upload to Cloudinary (direct from buffer)
    const [originalUpload, processedUpload, thumbnailUpload] = await Promise.all([
      cloudinary.uploader.upload(file.path, { folder: 'crop-disease/original' }), // original still from disk
      uploadBufferToCloudinary(processedBuffer, 'processed'),
      uploadBufferToCloudinary(thumbnailBuffer, 'thumbnails'),
    ]);

    // Save to database
    const savedImage = await prisma.image.create({
      data: {
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: originalUpload.secure_url,
        processedPath: processedUpload.secure_url,
        thumbnailPath: thumbnailUpload.secure_url,
        width: metadata.width,
        height: metadata.height,
        userId,
        processingStatus: ProcessingStatus.COMPLETED,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Clean up uploaded local file safely
   // Clean up uploaded local file safely
try {
  setTimeout(async () => {
    try {
      await fs.rm(file.path, { force: true });
      console.log(`Temp file deleted: ${file.path}`);
    } catch (err) {
      console.error('Error deleting temp file after delay:', err);
    }
  }, 1000); // 1s delay so Sharp/Cloudinary releases the lock
} catch (err) {
  console.error('Error scheduling temp file deletion:', err);
}


    return {
      ...savedImage,
      urls: {
        original: savedImage.path,
        processed: savedImage.processedPath!,
        thumbnail: savedImage.thumbnailPath!,
      },
      transformedUrls: {
        small: savedImage.path.replace('/upload/', '/upload/w_300,h_200,c_fill/'),
        medium: savedImage.path.replace('/upload/', '/upload/w_600,h_400,c_fill/'),
        large: savedImage.path.replace('/upload/', '/upload/w_1200,h_800,c_fill/'),
      },
    };
  } catch (error) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to process and save image'
    );
  }
};

// Update other functions to work with Cloudinary URLs
const getAllImages = async (query: any) => {
  const {
    page = 1,
    limit = 10,
    sortBy = 'uploadedAt',
    sortOrder = 'desc',
    search,
    userId,
    processingStatus,
  } = query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where: any = {};

  if (search) {
    where.originalName = {
      contains: search,
      mode: 'insensitive',
    };
  }

  if (userId) {
    where.userId = userId;
  }

  if (processingStatus) {
    where.processingStatus = processingStatus;
  }

  const [images, totalCount] = await Promise.all([
    prisma.image.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        predictions: {
          include: {
            disease: {
              select: {
                id: true,
                name: true,
                severity: true,
              },
            },
          },
        },
      },
    }),
    prisma.image.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / parseInt(limit));

  // Add URLs to each image (direct Cloudinary URLs)
  const imagesWithUrls = images.map(image => ({
    ...image,
    urls: {
      original: image.path,
      processed: image.processedPath!,
      thumbnail: image.thumbnailPath!,
    },
    // Additional Cloudinary transformations
    transformedUrls: {
      small: image.path.replace('/upload/', '/upload/w_300,h_200,c_fill/'),
      medium: image.path.replace('/upload/', '/upload/w_600,h_400,c_fill/'),
      large: image.path.replace('/upload/', '/upload/w_1200,h_800,c_fill/'),
    }
  }));

  return {
    images: imagesWithUrls,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalCount,
      hasNextPage: parseInt(page) < totalPages,
      hasPrevPage: parseInt(page) > 1,
    },
  };
};

const getImageById = async (id: string) => {
  const image = await prisma.image.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      predictions: {
        include: {
          disease: true,
        },
      },
    },
  });

  if (!image) {
    throw new AppError(httpStatus.NOT_FOUND, 'Image not found');
  }

  // Return with direct Cloudinary URLs
  return {
    ...image,
    urls: {
      original: image.path,
      processed: image.processedPath!,
      thumbnail: image.thumbnailPath!,
    },
    transformedUrls: {
      small: image.path.replace('/upload/', '/upload/w_300,h_200,c_fill/'),
      medium: image.path.replace('/upload/', '/upload/w_600,h_400,c_fill/'),
      large: image.path.replace('/upload/', '/upload/w_1200,h_800,c_fill/'),
    }
  };
};

const getUserImages = async (userId: string, query: any) => {
  const modifiedQuery = { ...query, userId };
  return await getAllImages(modifiedQuery);
};

const deleteImage = async (id: string, userId: string, userRole: string) => {
  const image = await prisma.image.findUnique({
    where: { id },
  });

  if (!image) {
    throw new AppError(httpStatus.NOT_FOUND, 'Image not found');
  }

  if (userRole !== 'ADMIN' && image.userId !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, 'Access denied');
  }

  // Extract Cloudinary public IDs from URLs
  const getPublicId = (url: string) => {
    const matches = url.match(/\/([^\/]+)\.(jpg|jpeg|png|gif|webp)$/i);
    return matches ? matches[1] : null;
  };

  // Delete from Cloudinary
  try {
    const originalPublicId = getPublicId(image.path);
    const processedPublicId = image.processedPath ? getPublicId(image.processedPath) : null;
    const thumbnailPublicId = image.thumbnailPath ? getPublicId(image.thumbnailPath) : null;

    const deletePromises = [];
    if (originalPublicId) deletePromises.push(cloudinary.uploader.destroy(`crop-disease/original/${originalPublicId}`));
    if (processedPublicId) deletePromises.push(cloudinary.uploader.destroy(`crop-disease/processed/${processedPublicId}`));
    if (thumbnailPublicId) deletePromises.push(cloudinary.uploader.destroy(`crop-disease/thumbnails/${thumbnailPublicId}`));

    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
  }

  // Delete from database
  await prisma.image.delete({
    where: { id },
  });

  return { message: 'Image deleted successfully' };
};

const bulkDeleteImages = async (imageIds: string[], userId: string, userRole: string) => {
    // Implementation similar to deleteImage but for multiple images
    const whereClause: any = { id: { in: imageIds } };
    if (userRole !== 'ADMIN') whereClause.userId = userId;

    const images = await prisma.image.findMany({ where: whereClause });

    if (images.length === 0) {
      throw new AppError(httpStatus.NOT_FOUND, 'No images found to delete');
    }

    // Delete from Cloudinary
    for (const image of images) {
      try {
        const getPublicId = (url: string) => {
          const matches = url.match(/\/([^\/]+)\.(jpg|jpeg|png|gif|webp)$/i);
          return matches ? matches[1] : null;
        };

        const originalPublicId = getPublicId(image.path);
        const processedPublicId = image.processedPath ? getPublicId(image.processedPath) : null;
        const thumbnailPublicId = image.thumbnailPath ? getPublicId(image.thumbnailPath) : null;

        const deletePromises = [];
        if (originalPublicId) deletePromises.push(cloudinary.uploader.destroy(`crop-disease/original/${originalPublicId}`));
        if (processedPublicId) deletePromises.push(cloudinary.uploader.destroy(`crop-disease/processed/${processedPublicId}`));
        if (thumbnailPublicId) deletePromises.push(cloudinary.uploader.destroy(`crop-disease/thumbnails/${thumbnailPublicId}`));

        await Promise.all(deletePromises);
      } catch (error) {
        console.error(`Error deleting image ${image.id} from Cloudinary:`, error);
      }
    }
}

const  getImageStats = async (userId?: string) => {
    const where = userId ? { userId } : {};

    const [totalImages, processingStats, sizeStats] = await Promise.all([
      prisma.image.count({ where }),
      prisma.image.groupBy({ by: ['processingStatus'], where, _count: true }),
      prisma.image.aggregate({ where, _sum: { size: true }, _avg: { size: true } }),
    ]);

    return {
      totalImages,
      processingStats,
      totalSize: sizeStats._sum.size || 0,
      averageSize: Math.round(sizeStats._avg.size || 0),
    };
};


const  reprocessImage = async (id: string) => {
    // Similar to original but using Cloudinary
    const image = await prisma.image.findUnique({ where: { id } });

    if (!image) {
      throw new AppError(httpStatus.NOT_FOUND, 'Image not found');
    }

    // Implementation would involve re-downloading from Cloudinary, 
    // processing, and re-uploading
    throw new AppError(httpStatus.NOT_IMPLEMENTED, 'Reprocessing with Cloudinary not implemented yet');
};



export const ImageService = {
  uploadImage,
  getAllImages,
  getImageById,
  deleteImage,
  bulkDeleteImages,
  getImageStats,
  reprocessImage,
  getUserImages
}