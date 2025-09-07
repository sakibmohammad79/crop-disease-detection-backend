import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { UpdateAdminProfileInput } from "./admin.validation";
import { sendResponse } from "../../utils/response";

import status from "http-status";
import { AdminService } from "./admin.service";

// Get all admins with pagination and filtering
const getAllAdmins = catchAsync(async (req: Request, res: Response) => {
  const {
    page,
    limit,
    search,
    isActive,
    sortBy,
    sortOrder
  } = req.query;

  const params = {
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    search: search as string,
    isActive: isActive ? isActive === 'true' : undefined,
    sortBy: sortBy as string,
    sortOrder: sortOrder as 'asc' | 'desc',
  };

  const result = await AdminService.getAllAdminsFromDB(params);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Admins retrieved successfully",
    meta: result.meta,
    data: result.admins,
  });
});

// Get admin by ID
const getAdminById = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;

  const result = await AdminService.getAdminByIdFromDB(userId);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Admin retrieved successfully",
    data: result,
  });
});

// Get admins by department
const getAdminsByDepartment = catchAsync(async (req: Request, res: Response) => {
  const { department } = req.params;
  const { limit } = req.query;

  const result = await AdminService.getAdminsByDepartmentFromDB(
    department,
    limit ? parseInt(limit as string) : undefined
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: `Admins in '${department}' department retrieved successfully`,
    data: result,
  });
});

// Get admins statistics
const getAdminsStats = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getAdminsStatsFromDB();

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Admins statistics retrieved successfully",
    data: result,
  });
});

const updateAdminProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId!;
  const profileData: UpdateAdminProfileInput = req.body;
  const result = await AdminService.updateAdminProfile(userId, profileData);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Admin profile updated successfully',
    data: result,
  });
});

export const AdminController = {
    getAllAdmins,
    updateAdminProfile,
    getAdminsStats,
    getAdminById,
    getAdminsByDepartment
}