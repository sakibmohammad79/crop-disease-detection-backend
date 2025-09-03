import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { UpdateFarmerProfileInput } from "./farmer.validation";
import { sendResponse } from "../../utils/response";
import { FarmerService } from "../farmer/farmer.service";
import status from "http-status";

// Update farmer profile
export const updateFarmerProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId!;
  const profileData: UpdateFarmerProfileInput = req.body;
  
  const result  = await FarmerService.updateFarmerProfile(userId, profileData);
  
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Farmer profile updated successfully',
    data: result,
  });
});


export const FarmerController = {
    updateFarmerProfile,
}