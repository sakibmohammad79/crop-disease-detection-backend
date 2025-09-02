import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/response";
import { UserService } from "./user.service";
import status from "http-status";

// Get my profile
export const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId!;
  const user = await UserService.getUserProfile(userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Profile retrieved successfully',
    data: user,
  });
});

// Get all users (admin only)
const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, role, search } = req.query;
  
  const params = {
    page: page ? parseInt(page as string) : 1,
    limit: limit ? parseInt(limit as string) : 10,
    role: role as string,
    search: search as string,
  };
  
  const result = await UserService.getAllUsers(params);
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Users retrieved successfully',
    data: result.users,
    meta: result.meta,
  });
});

// Update profile
const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId!;
  const { name, phone, address, photo } = req.body;
  const updateData = { name, phone, address, photo };
  const user = await UserService.updateUserProfile(userId, updateData);
  
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Profile updated successfully',
    data: user,
  });
});

export const UserController = {
    getMyProfile,
    getAllUsers,
    updateProfile
}