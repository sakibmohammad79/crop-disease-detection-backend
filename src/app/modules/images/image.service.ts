import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import httpStatus from 'http-status';
import { v2 as cloudinary } from 'cloudinary';
import { AppError } from '../../errors/AppError';
import { PrismaClient, ProcessingStatus } from '../../../generated/prisma';
import { uploadBufferToCloudinary } from '../../helpers/uploadToCloudinary';
import { MLService } from '../ml/ml.service';

const prisma = new PrismaClient();

// ============================
// 🎯 MAIN UPLOAD FUNCTION
// ============================
const uploadImage = async (file: Express.Multer.File, userId: string) => {
  if (!file) {
    throw new AppError(httpStatus.BAD_REQUEST, 'No file uploaded');
  }

  const tempFilePath = file.path;

  try {
    // Process and upload images
    const { metadata, uploads } = await processAndUploadImage(file);
    
    // Clean up temp file immediately
    await cleanupTempFile(tempFilePath);

    // Save to database
    const savedImage = await saveImageToDatabase(file, { metadata, uploads }, userId);

    // Process ML prediction
    const mlResult = await processMLPrediction(savedImage);

    return formatImageResponse(savedImage, mlResult);

  } catch (error) {
    await cleanupTempFile(tempFilePath);
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to process and save image');
  }
};

// ============================
// 🖼️ IMAGE PROCESSING
// ============================
const processAndUploadImage = async (file: Express.Multer.File) => {
  const metadata = await sharp(file.path).metadata();

  // Create processed versions in parallel
  const [processedBuffer, thumbnailBuffer] = await Promise.all([
    sharp(file.path)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .jpeg({ quality: 90 })
      .toBuffer(),
    
    sharp(file.path)
      .resize(150, 150, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer()
  ]);

  // Upload all versions to Cloudinary in parallel
  const [originalUpload, processedUpload, thumbnailUpload] = await Promise.all([
    cloudinary.uploader.upload(file.path, { folder: 'crop-disease/original' }),
    uploadBufferToCloudinary(processedBuffer, 'processed'),
    uploadBufferToCloudinary(thumbnailBuffer, 'thumbnails'),
  ]);

  return {
    metadata,
    uploads: { originalUpload, processedUpload, thumbnailUpload }
  };
};

const saveImageToDatabase = async (
  file: Express.Multer.File, 
  { metadata, uploads }: any, 
  userId: string
) => {
  return await prisma.image.create({
    data: {
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: uploads.originalUpload.secure_url,
      processedPath: uploads.processedUpload.secure_url,
      thumbnailPath: uploads.thumbnailUpload.secure_url,
      width: metadata.width,
      height: metadata.height,
      userId,
      processingStatus: ProcessingStatus.COMPLETED,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
};

// ============================
// 🤖 ML PREDICTION
// ============================
const processMLPrediction = async (savedImage: any) => {
  try {
    console.log(`🤖 Processing ML prediction for image: ${savedImage.id}`);
    
    const mlResult = await MLService.predictDiseaseFromImageUrl(
      savedImage.processedPath,
      savedImage.id,
      savedImage.userId
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

      return {
        status: 'success',
        data: {
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
        },
        error: null
      };
    }

    return { status: 'failed', data: null, error: 'ML service returned unsuccessful result' };

  } catch (error) {
    console.error(`❌ ML prediction failed for image ${savedImage.id}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'ML service unavailable';
    
    await prisma.image.update({
      where: { id: savedImage.id },
      data: { processingError: `ML prediction failed: ${errorMessage}` },
    });

    return { status: 'failed', data: null, error: errorMessage };
  }
};

// ============================
// 🧹 FILE CLEANUP SYSTEM
// ============================
const cleanupQueue = new Set<string>();

const cleanupTempFile = async (filePath: string): Promise<void> => {
  try {
    await fs.access(filePath);
    
    if (process.platform === 'win32') {
      const deleted = await windowsFileCleanup(filePath);
      if (deleted) {
        console.log(`🗑️  File cleaned: ${path.basename(filePath)}`);
      } else {
        addToCleanupQueue(filePath);
      }
    } else {
      await fs.unlink(filePath);
      console.log(`🗑️  File cleaned: ${path.basename(filePath)}`);
    }
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log(`ℹ️  File already removed: ${path.basename(filePath)}`);
    } else {
      console.log(`⚠️  Cleanup queued: ${path.basename(filePath)}`);
      addToCleanupQueue(filePath);
    }
  }
};

const windowsFileCleanup = async (filePath: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const deleteProcess = spawn('powershell', [
      '-Command', 
      `Remove-Item -Path "${filePath}" -Force -ErrorAction SilentlyContinue`
    ], {
      stdio: 'ignore',
      windowsHide: true
    });

    deleteProcess.on('close', async () => {
      try {
        await fs.access(filePath);
        resolve(false);
      } catch {
        resolve(true);
      }
    });

    deleteProcess.on('error', () => resolve(false));
    setTimeout(() => { deleteProcess.kill(); resolve(false); }, 3000);
  });
};

const addToCleanupQueue = (filePath: string): void => {
  cleanupQueue.add(filePath);
  console.log(`📝 Added to cleanup queue: ${path.basename(filePath)} (Total: ${cleanupQueue.size})`);
};

// Background cleanup worker
setInterval(async () => {
  if (cleanupQueue.size === 0) return;

  const filesToCleanup = Array.from(cleanupQueue);
  const cleanedFiles: string[] = [];

  for (const filePath of filesToCleanup) {
    try {
      await fs.access(filePath);
      await fs.unlink(filePath);
      cleanedFiles.push(filePath);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        cleanedFiles.push(filePath);
      }
    }
  }

  cleanedFiles.forEach(file => cleanupQueue.delete(file));
  
  if (cleanedFiles.length > 0) {
    console.log(`🧹 Background cleanup: ${cleanedFiles.length} files removed`);
  }
}, 30000);

// ============================
// 📝 QUERY & RETRIEVAL
// ============================
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

  // Build query filters
  if (search) where.originalName = { contains: search, mode: 'insensitive' };
  if (userId) where.userId = userId;
  if (processingStatus) where.processingStatus = processingStatus;

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
  const imagesWithUrls = images.map(formatImageWithUrls);

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
    ...formatImageWithUrls(image),
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
  return await getAllImages({ ...query, userId });
};

// ============================
// 🗑️ DELETE OPERATIONS
// ============================
const deleteImage = async (id: string, userId: string, userRole: string) => {
  const image = await prisma.image.findUnique({ where: { id } });

  if (!image) {
    throw new AppError(httpStatus.NOT_FOUND, 'Image not found');
  }

  if (userRole !== 'ADMIN' && image.userId !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, 'Access denied');
  }

  // Delete from Cloudinary
  await deleteFromCloudinary([image]);

  // Delete from database
  await prisma.image.delete({ where: { id } });

  return { message: 'Image deleted successfully' };
};

const bulkDeleteImages = async (imageIds: string[], userId: string, userRole: string) => {
  const whereClause: any = { id: { in: imageIds } };
  if (userRole !== 'ADMIN') whereClause.userId = userId;

  const images = await prisma.image.findMany({ where: whereClause });

  if (images.length === 0) {
    throw new AppError(httpStatus.NOT_FOUND, 'No images found to delete');
  }

  // Delete from Cloudinary
  await deleteFromCloudinary(images);

  // Delete from database
  await prisma.image.deleteMany({ where: whereClause });

  return { message: `${images.length} images deleted successfully` };
};

const deleteFromCloudinary = async (images: any[]) => {
  for (const image of images) {
    try {
      const getPublicId = (url: string) => {
        const matches = url.match(/\/([^\/]+)\.(jpg|jpeg|png|gif|webp)$/i);
        return matches ? matches[1] : null;
      };

      const deletePromises = [];
      const originalId = getPublicId(image.path);
      const processedId = image.processedPath ? getPublicId(image.processedPath) : null;
      const thumbnailId = image.thumbnailPath ? getPublicId(image.thumbnailPath) : null;

      if (originalId) deletePromises.push(cloudinary.uploader.destroy(`crop-disease/original/${originalId}`));
      if (processedId) deletePromises.push(cloudinary.uploader.destroy(`crop-disease/processed/${processedId}`));
      if (thumbnailId) deletePromises.push(cloudinary.uploader.destroy(`crop-disease/thumbnails/${thumbnailId}`));

      await Promise.all(deletePromises);
    } catch (error) {
      console.error(`❌ Error deleting image ${image.id} from Cloudinary:`, error);
    }
  }
};

// ============================
// 📊 STATISTICS & ANALYTICS
// ============================
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

// ============================
// 🔧 UTILITY FUNCTIONS
// ============================
const formatImageResponse = (savedImage: any, mlResult: any) => {
  return {
    ...savedImage,
    urls: generateImageUrls(savedImage),
    transformedUrls: generateTransformedUrls(savedImage.path),
    mlPrediction: mlResult.data,
    mlError: mlResult.error,
    mlStatus: mlResult.status,
  };
};

const formatImageWithUrls = (image: any) => {
  return {
    ...image,
    urls: generateImageUrls(image),
    transformedUrls: generateTransformedUrls(image.path),
    mlSummary: image.predictions?.length > 0 ? {
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
  };
};

const generateImageUrls = (image: any) => ({
  original: image.path,
  processed: image.processedPath!,
  thumbnail: image.thumbnailPath!,
});

const generateTransformedUrls = (originalPath: string) => ({
  small: originalPath.replace('/upload/', '/upload/w_300,h_200,c_fill/'),
  medium: originalPath.replace('/upload/', '/upload/w_600,h_400,c_fill/'),
  large: originalPath.replace('/upload/', '/upload/w_1200,h_800,c_fill/'),
});

// ============================
// 📤 SERVICE EXPORTS
// ============================
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