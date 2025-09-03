import status from "http-status";
import { AppError } from "../../errors/AppError";
import prisma from "../../utils/prisma";
import { UpdateFarmerProfileInput } from "./farmer.validation";

// Update farmer profile
const updateFarmerProfile = async (
  userId: string,
  profileData: UpdateFarmerProfileInput
) => {
  // Check if user is farmer
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      role: 'FARMER',
      isActive: true,
      isDeleted: false,
    }
  });

  if (!user) {
    throw new AppError("Farmer not found", status.NOT_FOUND);
  }

  // Update farmer profile
  const updatedProfile = await prisma.farmerProfile.update({
    where: { userId },
    data: profileData,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          photo: true,
          address: true,
          createdAt: true,
          updatedAt: true,
        }
      }
    }
  });

  return updatedProfile;
};


export const FarmerService = {
    updateFarmerProfile,
}