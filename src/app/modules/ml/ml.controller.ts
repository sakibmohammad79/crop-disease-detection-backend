// src/app/modules/ml/ml.controller.ts
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/response';
import { MLService } from './ml.service';
import { AppError } from '../../errors/AppError';

const checkMLHealth = catchAsync(async (req: Request, res: Response) => {
  const result = await MLService.checkMLServiceHealth();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: result.isHealthy,
    message: result.isHealthy ? 'ML service is healthy' : 'ML service is not available',
    data: result,
  });
});

const getMLServiceInfo = catchAsync(async (req: Request, res: Response) => {
  const result = await MLService.getMLServiceInfo();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'ML service information retrieved successfully',
    data: result,
  });
});

const predictImageDisease = catchAsync(async (req: Request, res: Response) => {
  const { imageId } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  if (!imageId) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Image ID is required');
  }

  // Get image details from database
  const { ImageService } = require('../image/image.service');
  const image = await ImageService.getImageById(imageId);

  if (!image) {
    throw new AppError(httpStatus.NOT_FOUND, 'Image not found');
  }

  // Check if user owns the image or is admin
  if (req.user?.role !== 'ADMIN' && image.userId !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, 'Access denied');
  }

  const result = await MLService.predictDiseaseFromImageUrl(
    image.processedPath || image.path,
    imageId,
    userId
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Disease prediction completed successfully',
    data: result,
  });
});

const batchPredict = catchAsync(async (req: Request, res: Response) => {
  const { imageIds } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  if (!Array.isArray(imageIds) || imageIds.length === 0) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Image IDs array is required');
  }

  if (imageIds.length > 10) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Cannot process more than 10 images at once');
  }

  // Get images from database
  const { ImageService } = require('../image/image.service');
  const images = await Promise.all(
    imageIds.map((id: string) => ImageService.getImageById(id).catch(() => null))
  );

  const validImages = images.filter(Boolean);
  
  if (validImages.length === 0) {
    throw new AppError(httpStatus.NOT_FOUND, 'No valid images found');
  }

  // Check permissions
  const unauthorizedImages = validImages.filter(
    (image: any) => req.user?.role !== 'ADMIN' && image.userId !== userId
  );

  if (unauthorizedImages.length > 0) {
    throw new AppError(httpStatus.FORBIDDEN, 'Access denied for some images');
  }

  const imageUrls = validImages.map((image: any) => ({
    id: image.id,
    url: image.processedPath || image.path
  }));

  const result = await MLService.batchPredict(imageUrls, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Batch prediction completed',
    data: result,
  });
});

export const MLController = {
  checkMLHealth,
  getMLServiceInfo,
  predictImageDisease,
  batchPredict,
};