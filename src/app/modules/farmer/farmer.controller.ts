import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/response";
import { FarmerService } from "./farmer.service";

// Update farmer profile
const updateFarmerProfile = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const profileData = req.body;

  const result = await FarmerService.updateFarmerProfile(userId, profileData);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Farmer profile updated successfully",
    data: result,
  });
});

// Get all farmers with pagination and filtering
const getAllFarmers = catchAsync(async (req: Request, res: Response) => {
  const {
    page,
    limit,
    search,
    cropType,
    isActive,
    sortBy,
    sortOrder
  } = req.query;

  const params = {
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    search: search as string,
    cropType: cropType as string,
    isActive: isActive ? isActive === 'true' : undefined,
    sortBy: sortBy as string,
    sortOrder: sortOrder as 'asc' | 'desc',
  };

  const result = await FarmerService.getAllFarmersFromDB(params);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Farmers retrieved successfully",
    meta: result.meta,
    data: result.farmers,
  });
});

// Get farmer by ID
const getFarmerById = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;

  const result = await FarmerService.getFarmerByIdFromDB(userId);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Farmer retrieved successfully",
    data: result,
  });
});

// Get farmers statistics
const getFarmersStats = catchAsync(async (req: Request, res: Response) => {
  const result = await FarmerService.getFarmersStats();
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Farmers statistics retrieved successfully",
    data: result,
  });
});

// // Get farmers by crop type
const getFarmersByCropType = catchAsync(async (req: Request, res: Response) => {
  const { cropType } = req.params;
  const { limit } = req.query;

  const result = await FarmerService.getFarmersByCropType(
    cropType,
    limit ? parseInt(limit as string) : undefined
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: `Farmers with crop type '${cropType}' retrieved successfully`,
    data: result,
  });
});

export const FarmerController = {
  updateFarmerProfile,
  getAllFarmers,
  getFarmerById,
  getFarmersStats,
  getFarmersByCropType,
};