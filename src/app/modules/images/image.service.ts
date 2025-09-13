import sharp from 'sharp';
import fs from 'fs/promises';
import httpStatus from 'http-status';
import { v2 as cloudinary } from 'cloudinary';
import { AppError } from '../../errors/AppError';
import { PrismaClient, ProcessingStatus } from '../../../generated/prisma';
import { uploadBufferToCloudinary } from '../../helpers/uploadToCloudinary';
import { MLService } from '../ml/ml.service';

const prisma = new PrismaClient();

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
      cloudinary.uploader.upload(file.path, { folder: 'crop-disease/original' }), 
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

    // 🔹 ML INTEGRATION
    let mlPrediction = null;
    let mlError = null;

    try {
      console.log(`Sending image ${savedImage.id} for ML prediction...`);
      const mlResult = await MLService.predictDiseaseFromImageUrl(
        savedImage.processedPath as string,
        savedImage.id,
        userId
      );

      if (mlResult.success) {
        const prediction = await prisma.prediction.create({
          data: {
            imageId: savedImage.id,
            confidence: mlResult.prediction.confidence,
            isHealthy: mlResult.prediction.is_healthy,
            diseaseId: null,
            affectedArea: mlResult.prediction.affected_area_percentage || 0,
            modelVersion: mlResult.prediction.model_version || 'v1.0',
            processingTime: mlResult.processingTime || 0,
          },
        });

        mlPrediction = {
          id: prediction.id,
          disease: mlResult.prediction.disease,
          diseaseName: mlResult.prediction.disease_name,
          confidence: mlResult.prediction.confidence,
          isHealthy: mlResult.prediction.is_healthy,
          severity: mlResult.prediction.severity,
          description: mlResult.prediction.description,
          affectedArea: mlResult.prediction.affected_area_percentage,
          treatment: mlResult.treatment,
          processingTime: mlResult.processingTime,
        };
      }
    } catch (error) {
      console.error(`ML prediction failed for image ${savedImage.id}:`, error);
      mlError = error instanceof Error ? error.message : 'ML service unavailable';
      await prisma.image.update({
        where: { id: savedImage.id },
        data: { processingError: `ML prediction failed: ${mlError}` },
      });
    }

    // Clean up uploaded local file safely
    try {
      setTimeout(async () => {
        try {
          await fs.rm(file.path, { force: true });
          console.log(`Temp file deleted: ${file.path}`);
        } catch (err) {
          console.error('Error deleting temp file after delay:', err);
        }
      }, 1000);
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
      mlPrediction,
      mlError,
      mlStatus: mlPrediction ? 'success' : (mlError ? 'failed' : 'pending'),
    };
  } catch (error) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to process and save image'
    );
  }
};

// Update other functions to work with Cloudinary + ML
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
    where.originalName = { contains: search, mode: 'insensitive' };
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
      orderBy: { [sortBy]: sortOrder },
      include: {
        user: { select: { id: true, name: true, email: true } },
        predictions: {
          include: { disease: { select: { id: true, name: true, severity: true } } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    }),
    prisma.image.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / parseInt(limit));

  const imagesWithUrls = images.map(image => ({
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
    },
    mlSummary: image.predictions.length > 0 ? {
      hasPrediction: true,
      isHealthy: image.predictions[0].isHealthy,
      confidence: Math.round(image.predictions[0].confidence * 100),
      diseaseName: image.predictions[0].disease?.name || 'Unknown',
      severity: image.predictions[0].disease?.severity || 'UNKNOWN',
    } : {
      hasPrediction: false,
      isHealthy: null,
      confidence: 0,
      diseaseName: null,
      severity: null,
    },
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
      user: { select: { id: true, name: true, email: true } },
      predictions: {
        include: { disease: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!image) {
    throw new AppError(httpStatus.NOT_FOUND, 'Image not found');
  }

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
    },
    mlAnalysis: {
      totalPredictions: image.predictions.length,
      latestPrediction: image.predictions.length > 0 ? image.predictions[0] : null,
      hasDiseaseDetected: image.predictions.some(p => !p.isHealthy),
      averageConfidence: image.predictions.length > 0
        ? Math.round((image.predictions.reduce((sum, p) => sum + p.confidence, 0) / image.predictions.length) * 100)
        : 0,
    },
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




const getImageStats = async (userId?: string) => {
  const where = userId ? { userId } : {};

  const [totalImages, processingStats, sizeStats, mlStats] = await Promise.all([
    prisma.image.count({ where }),
    prisma.image.groupBy({ by: ['processingStatus'], where, _count: true }),
    prisma.image.aggregate({ where, _sum: { size: true }, _avg: { size: true } }),
    prisma.prediction.groupBy({
      by: ['isHealthy'],
      where: userId ? { image: { userId } } : {},
      _count: true,
    }),
  ]);

  return {
    totalImages,
    processingStats,
    totalSize: sizeStats._sum.size || 0,
    averageSize: Math.round(sizeStats._avg.size || 0),
    mlStats: {
      totalPredictions: mlStats.reduce((sum, stat) => sum + stat._count, 0),
      healthyPredictions: mlStats.find(stat => stat.isHealthy)?._count || 0,
      diseasePredictions: mlStats.find(stat => !stat.isHealthy)?._count || 0,
    },
  };
};

const reprocessImage = async (id: string) => {
  const image = await prisma.image.findUnique({ where: { id } });

  if (!image) {
    throw new AppError(httpStatus.NOT_FOUND, 'Image not found');
  }

  try {
    const mlResult = await MLService.predictDiseaseFromImageUrl(
      image.processedPath!,
      image.id,
      image.userId
    );

    if (mlResult.success) {
      await prisma.prediction.create({
        data: {
          imageId: image.id,
          confidence: mlResult.prediction.confidence,
          isHealthy: mlResult.prediction.is_healthy,
          diseaseId: null,
          affectedArea: mlResult.prediction.affected_area_percentage || 0,
          modelVersion: mlResult.prediction.model_version || 'v1.0',
          processingTime: mlResult.processingTime || 0,
        },
      });
    }

    return { message: 'Image reprocessed successfully', mlResult };
  } catch (error) {
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to reprocess image');
  }
};

export const ImageService = {
  uploadImage,
  getAllImages,
  getImageById,
  getUserImages,
  deleteImage,
  bulkDeleteImages,
  getImageStats,
  reprocessImage,
};
