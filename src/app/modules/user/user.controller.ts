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
const updateUser = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId!;
  const { name, phone, address, photo } = req.body;
  const updateData = { name, phone, address, photo };
  const user = await UserService.updateUser(userId, updateData);
  
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Profile updated successfully',
    data: user,
  });
});


// Get user by ID (admin only)
const getUserById = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const user = await UserService.getUserById(userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User retrieved successfully',
    data: user,
  });
});

// Toggle user status (admin only)
const toggleUserStatus = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { status } = req.body;
  const user = await UserService.toggleUserStatus(userId, status);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: `User ${status ? 'activated' : 'deactivated'} successfully`,
    data: user,
  });
});

// Delete user (admin only)
const userSoftteDelete = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  
  const user = await UserService.userSoftDelete(userId);
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User deleted successfully',
    data: user,
  });
});
// Delete user (admin only)
const userhardDelete = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const user = await UserService.userHardDelete(userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User deleted successfully',
    data: user,
  });
});

export const UserController = {
    getMyProfile,
    getAllUsers,
    updateUser,
    getUserById,
    toggleUserStatus,
    userSoftteDelete,
    userhardDelete
}