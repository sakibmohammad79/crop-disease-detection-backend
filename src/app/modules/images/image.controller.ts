import { Request, Response } from 'express';
import httpStatus from 'http-status';
import path from 'path';
import { catchAsync } from '../../utils/catchAsync';
import { AppError } from '../../errors/AppError';
import { ImageService } from './image.service';
import { sendResponse } from '../../utils/response';

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
  const result = await ImageService.reprocessImage(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Image reprocessed successfully',
    data: result,
  });
});

const downloadImage = catchAsync(async (req: Request, res: Response) => {
  const { id, type = 'original' } = req.params;
  
  const image = await ImageService.getImageById(id);
  
  let filePath: string;
  let fileName: string;
  
  switch (type) {
    case 'processed':
      filePath = image.processedPath || '';
      fileName = `processed_${image.originalName}`;
      break;
    case 'thumbnail':
      filePath = image.thumbnailPath || '';
      fileName = `thumb_${image.originalName}`;
      break;
    case 'original':
    default:
      filePath = image.path;
      fileName = image.originalName;
      break;
  }

  if (!filePath) {
    throw new AppError(httpStatus.NOT_FOUND, `${type} version not available`);
  }

  res.setHeader('Content-Type', image.mimetype);
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.sendFile(path.resolve(filePath));
});

const serveImage = catchAsync(async (req: Request, res: Response) => {
  const { id, type = 'original' } = req.params;
  
  const image = await ImageService.getImageById(id);
  
  let filePath: string;
  
  switch (type) {
    case 'processed':
      filePath = image.processedPath || '';
      break;
    case 'thumbnail':
      filePath = image.thumbnailPath || '';
      break;
    case 'original':
    default:
      filePath = image.path;
      break;
  }

  if (!filePath) {
    throw new AppError(httpStatus.NOT_FOUND, `${type} version not available`);
  }

  res.setHeader('Content-Type', image.mimetype);
  res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
  res.sendFile(path.resolve(filePath));
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