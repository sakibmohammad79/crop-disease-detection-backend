import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { UpdateAdminProfileInput } from "./admin.validation";
import { sendResponse } from "../../utils/response";
import { AdminService } from "./admin.service";
import status from "http-status";

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
    updateAdminProfile,
}