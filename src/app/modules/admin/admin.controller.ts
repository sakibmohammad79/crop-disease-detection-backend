import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { UpdateAdminProfileInput } from "./admin.validation";
import { sendResponse } from "../../utils/response";
import { AdminService } from "./admin.service";
import status from "http-status";

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
}