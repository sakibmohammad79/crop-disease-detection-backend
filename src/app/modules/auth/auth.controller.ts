// modules/auth/auth.controller.ts
import { Request, Response } from 'express';
import { sendResponse } from '../../utils/response';
import * as authService from './auth.service';
import { config } from '../../config';
import status from 'http-status';
import { catchAsync } from '../../utils/catchAsync';



// Register farmer
export const registerFarmer = catchAsync(async (req: Request, res: Response) => {
  const userData = req.body;
  
  const result = await authService.registerFarmer(userData);
  
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Farmer registered successfully',
    data: result,
  });
});

// Register admin (only by existing admin)
export const registerAdmin = catchAsync(async (req: Request, res: Response) => {
  const userData = req.body;
  const result = await authService.registerAdmin(userData);
  
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Admin registered successfully',
    data: result,
  });
});

// Login
export const login = catchAsync(async (req: Request, res: Response) => {
  const credentials = req.body;
  
  const result = await authService.loginUser(credentials);
  const {refreshToken} = result;
  res.cookie("refreshToken", refreshToken, { 
    httpOnly: true,
    secure: config.app.nodeEnv === 'production',
  });
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Login successful',
    data: {
      accessToken : result.accessToken, 
      // needPasswordChange : result.needPasswordChange,
    },
  });
});

// Refresh token
export const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;
  const result = await authService.refreshToken(refreshToken);
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Access token generated successfully!",
    data: result,
  });
});

// Get my profile
export const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId!;
  
  const user = await authService.getUserProfile(userId);
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Profile retrieved successfully',
    data: user,
  });
});

// Update profile
export const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId!;
  const { name, phone, address, photo } = req.body;
  const updateData = { name, phone, address, photo };
  const user = await authService.updateUserProfile(userId, updateData);
  
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Profile updated successfully',
    data: user,
  });
});

// Change password
export const changePassword = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId!;
  const passwordData = req.body;
  
  const result = await authService.changeUserPassword(userId, passwordData);
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message,
  });
});

// Reset password
export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { userId, token, newPassword, confirmPassword } = req.body;
  
  const result = await authService.resetPassword({
    userId,
    token,
    newPassword,
    confirmPassword
  });
  
  sendResponse(res, {
    statusCode: 200,
    success: result.success,
    message: result.message,
  });
});

// Deactivate account
export const deactivateAccount = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId!;
  
  const result = await authService.deactivateUser(userId);
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message,
  });
});

// Get all users (admin only)
export const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, role, search } = req.query;
  
  const params = {
    page: page ? parseInt(page as string) : 1,
    limit: limit ? parseInt(limit as string) : 10,
    role: role as string,
    search: search as string,
  };
  
  const result = await authService.getAllUsers(params);
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Users retrieved successfully',
    data: result.users,
    meta: result.meta,
  });
});

// Forgot password
export const forgotPasswordController = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.forgotPassword({ email: req.body.email });
  
  sendResponse(res, {
    statusCode: 200,
    success: result.success,
    message: result.message,
    data: result.resetLink ? { resetLink: result.resetLink } : undefined,
  });
});