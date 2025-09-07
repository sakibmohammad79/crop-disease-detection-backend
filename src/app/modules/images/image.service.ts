import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import httpStatus from 'http-status';
import { AppError } from '../../errors/AppError';
import { PrismaClient, ProcessingStatus } from '../../../generated/prisma';

const prisma = new PrismaClient();

const uploadImage = async (file: Express.Multer.File, userId: string) => {
  if (!file) {
    throw new AppError(httpStatus.BAD_REQUEST, 'No file uploaded');
  }

  try {
    // Generate paths for processed and thumbnail images
    const fileId = crypto.randomUUID();
    const ext = path.extname(file.originalname);
    const processedFilename = `${fileId}_processed${ext}`;
    const thumbnailFilename = `${fileId}_thumb.jpg`;

    const processedPath = `uploads/images/processed/${processedFilename}`;
    const thumbnailPath = `uploads/images/thumbnails/${thumbnailFilename}`;

    // Get image metadata
    const metadata = await sharp(file.path).metadata();

    // Create processed image (ML-ready: 512x512)
    await sharp(file.path)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .jpeg({ quality: 90 })
      .toFile(processedPath);

    // Create thumbnail (150x150)
    await sharp(file.path)
      .resize(150, 150, {
        fit: 'cover',
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);

    // Save to database
    const savedImage = await prisma.image.create({
      data: {
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        processedPath,
        thumbnailPath,
        width: metadata.width,
        height: metadata.height,
        userId,
        processingStatus: ProcessingStatus.COMPLETED,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return savedImage;
  } catch (error) {
    // Clean up files if database save fails
    try {
      await fs.unlink(file.path);
    } catch (unlinkError) {
      console.error('Error deleting file:', unlinkError);
    }

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to process and save image'
    );
  }
};

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

  return {
    images,
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

  return image;
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

  await prisma.image.delete({
    where: { id },
  });

  const filesToDelete = [image.path, image.processedPath, image.thumbnailPath].filter(Boolean);

  for (const filePath of filesToDelete) {
    try {
      await fs.unlink(filePath as any);
    } catch (error) {
      console.error(`Failed to delete file: ${filePath}`, error);
    }
  }

  return { message: 'Image deleted successfully' };
};

const bulkDeleteImages = async (imageIds: string[], userId: string, userRole: string) => {
  const whereClause: any = { id: { in: imageIds } };
  if (userRole !== 'ADMIN') whereClause.userId = userId;

  const images = await prisma.image.findMany({ where: whereClause });

  if (images.length === 0) {
    throw new AppError(httpStatus.NOT_FOUND, 'No images found to delete');
  }

  await prisma.image.deleteMany({ where: whereClause });

  for (const image of images) {
    const filesToDelete = [image.path, image.processedPath, image.thumbnailPath].filter(Boolean);
    for (const filePath of filesToDelete) {
      try {
        await fs.unlink(filePath as any);
      } catch (error) {
        console.error(`Failed to delete file: ${filePath}`, error);
      }
    }
  }

  return { message: `${images.length} images deleted successfully`, deletedCount: images.length };
};

const getImageStats = async (userId?: string) => {
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

const reprocessImage = async (id: string) => {
  const image = await prisma.image.findUnique({ where: { id } });

  if (!image) {
    throw new AppError(httpStatus.NOT_FOUND, 'Image not found');
  }

  try {
    await prisma.image.update({
      where: { id },
      data: { processingStatus: ProcessingStatus.PROCESSING },
    });

    const fileId = crypto.randomUUID();
    const ext = path.extname(image.originalName);
    const processedFilename = `${fileId}_processed${ext}`;
    const thumbnailFilename = `${fileId}_thumb.jpg`;

    const newProcessedPath = `uploads/images/processed/${processedFilename}`;
    const newThumbnailPath = `uploads/images/thumbnails/${thumbnailFilename}`;

    await sharp(image.path)
      .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .jpeg({ quality: 90 })
      .toFile(newProcessedPath);

    await sharp(image.path)
      .resize(150, 150, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toFile(newThumbnailPath);

    if (image.processedPath) {
      try { await fs.unlink(image.processedPath); } catch (e) { console.error(e); }
    }
    if (image.thumbnailPath) {
      try { await fs.unlink(image.thumbnailPath); } catch (e) { console.error(e); }
    }

    const updatedImage = await prisma.image.update({
      where: { id },
      data: { processedPath: newProcessedPath, thumbnailPath: newThumbnailPath, processingStatus: ProcessingStatus.COMPLETED, processingError: null },
    });

    return updatedImage;
  } catch (error) {
    await prisma.image.update({
      where: { id },
      data: { processingStatus: ProcessingStatus.FAILED, processingError: error instanceof Error ? error.message : 'Unknown error' },
    });

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
