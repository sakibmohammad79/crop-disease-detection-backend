import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/response";
import { UserService } from "./user.service";

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

export const UserController = {
    getMyProfile,
}