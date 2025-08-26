// modules/auth/auth.controller.ts
import { Request, Response } from 'express';
import { sendResponse } from '../../utils/response';
import * as authService from './auth.service';
import { config } from '../../config';
// Register farmer
export const registerFarmer = async (req: Request, res: Response) => {
  try {
    const userData = req.body;
    
    const result = await authService.registerFarmer(userData);
    
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: 'Farmer registered successfully',
      data: result,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 400,
      success: false,
      message: error.message || 'Registration failed',
    });
  }
};

// Register admin (only by existing admin)
export const registerAdmin = async (req: Request, res: Response) => {
  try {
    const userData = req.body;
    const result = await authService.registerAdmin(userData);
    
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: 'Admin registered successfully',
      data: result,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 400,
      success: false,
      message: error.message || 'Registration failed',
    });
  }
};

// Login
export const login = async (req: Request, res: Response) => {
  try {
    const credentials = req.body;
    
    const result = await authService.loginUser(credentials);
    const {refreshToken} = result;
    res.cookie("refreshToken", refreshToken, { httpOnly: true,
    secure: config.app.nodeEnv === 'production',})
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Login successful',
      data: {
        accessToken : result.accessToken, 
        needPasswordChange : result.needPasswordChange
      },
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 401,
      success: false,
      message: error.message || 'Login failed',
    });
  }
};
//refresh token
export const refreshToken = async (req: Request, res: Response) => {
  try {
  
    const { refreshToken } = req.cookies;
    const result = await authService.refreshToken(refreshToken);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Access token genereated successfully!",
      data: result,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 401,
      success: false,
      message: error.message || 'Failed to generate access token.',
    });
  }
};

// Get my profile
export const getMyProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId!;
    
    const user = await authService.getUserProfile(userId);
    
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Profile retrieved successfully',
      data: user,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 404,
      success: false,
      message: error.message || 'User not found',
    });
  }
};

// Update profile
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId!;
    const updateData = req.body;
    
    const user = await authService.updateUserProfile(userId, updateData);
    
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 400,
      success: false,
      message: error.message || 'Profile update failed',
    });
  }
};

// Change password
export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId!;
    const passwordData = req.body;
    
    const result = await authService.changeUserPassword(userId, passwordData);
    
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 400,
      success: false,
      message: error.message || 'Password change failed',
    });
  }
};

// Deactivate account
export const deactivateAccount = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId!;
    
    const result = await authService.deactivateUser(userId);
    
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 400,
      success: false,
      message: error.message || 'Account deactivation failed',
    });
  }
};

// Get all users (admin only)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
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
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 400,
      success: false,
      message: error.message || 'Failed to retrieve users',
    });
  }
};

// Logout (client side token removal)
export const logout = async (req: Request, res: Response) => {
  try {
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Logout successful',
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 400,
      success: false,
      message: 'Logout failed',
    });
  }
}