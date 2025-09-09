
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/response';
import { ImageService } from './image.service';
import { AppError } from '../../errors/AppError';

const uploadImage = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError(httpStatus.BAD_REQUEST, 'No image file provided');
  }

  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  const result = await ImageService.uploadImage(req.file, userId);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Image uploaded successfully',
    data: result,
  });
});

const getAllImages = catchAsync(async (req: Request, res: Response) => {
  const result = await ImageService.getAllImages(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Images retrieved successfully',
    meta: result.pagination,
    data: result.images,
  });
});

const getImageById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ImageService.getImageById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Image retrieved successfully',
    data: result,
  });
});

const getUserImages = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  const result = await ImageService.getUserImages(userId, req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User images retrieved successfully',
    meta: result.pagination,
    data: result.images,
  });
});

const deleteImage = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;
  const userRole = req.user?.role;

  if (!userId) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  const result = await ImageService.deleteImage(id, userId, userRole as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Image deleted successfully',
    data: result,
  });
});

const bulkDeleteImages = catchAsync(async (req: Request, res: Response) => {
  const { imageIds } = req.body;
  const userId = req.user?.userId;
  const userRole = req.user?.role;

  if (!userId) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  if (!Array.isArray(imageIds) || imageIds.length === 0) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Image IDs array is required');
  }

  const result = await ImageService.bulkDeleteImages(imageIds, userId, userRole as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Images deleted successfully',
    data: result,
  });
});

const getImageStats = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.role === 'ADMIN' ? undefined : req.user?.userId;
  const result = await ImageService.getImageStats(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Image statistics retrieved successfully',
    data: result,
  });
});

const reprocessImage = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    const result = await ImageService.reprocessImage(id);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Image reprocessed successfully',
      data: result,
    });
  } catch (error) {
    if (error instanceof AppError && error.statusCode === httpStatus.NOT_IMPLEMENTED) {
      sendResponse(res, {
        statusCode: httpStatus.OK,
        success: false,
        message: 'Reprocessing feature is not available for Cloudinary images currently',
        data: null,
      });
    } else {
      throw error;
    }
  }
});

// For Cloudinary URLs, these will redirect to direct URLs
const downloadImage = catchAsync(async (req: Request, res: Response) => {
  const { id, type = 'original' } = req.params;
  
  const image = await ImageService.getImageById(id);
  
  let downloadUrl: string;
  let fileName: string;
  
  switch (type) {
    case 'processed':
      downloadUrl = image.processedPath!;
      fileName = `processed_${image.originalName}`;
      break;
    case 'thumbnail':
      downloadUrl = image.thumbnailPath!;
      fileName = `thumb_${image.originalName}`;
      break;
    case 'original':
    default:
      downloadUrl = image.path;
      fileName = image.originalName;
      break;
  }

  if (!downloadUrl) {
    throw new AppError(httpStatus.NOT_FOUND, `${type} version not available`);
  }

  // For Cloudinary URLs, add download flag and redirect
  if (downloadUrl.includes('cloudinary.com')) {
    const downloadWithFlag = downloadUrl.replace('/upload/', `/upload/fl_attachment:${fileName}/`);
    return res.redirect(downloadWithFlag);
  }

  // Fallback for local files
  res.redirect(downloadUrl);
});

const serveImage = catchAsync(async (req: Request, res: Response) => {
  const { id, type = 'original' } = req.params;
  
  const image = await ImageService.getImageById(id);
  
  let imageUrl: string;
  
  switch (type) {
    case 'processed':
      imageUrl = image.processedPath!;
      break;
    case 'thumbnail':
      imageUrl = image.thumbnailPath!;
      break;
    case 'original':
    default:
      imageUrl = image.path;
      break;
  }

  if (!imageUrl) {
    throw new AppError(httpStatus.NOT_FOUND, `${type} version not available`);
  }

  // For Cloudinary URLs, redirect directly
  if (imageUrl.includes('cloudinary.com')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    return res.redirect(imageUrl);
  }

  // Fallback for local files
  res.redirect(imageUrl);
});

export const ImageController = {
  uploadImage,
  getAllImages,
  getImageById,
  getUserImages,
  deleteImage,
  bulkDeleteImages,
  getImageStats,
  reprocessImage,
  downloadImage,
  serveImage,
};