import prisma from "../../utils/prisma";

// Get user profile
export const getUserProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { 
      id: userId,
      isActive: true,
      isDeleted: false 
    },
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
      lastLoginAt: true,
      farmerProfile: true,
      adminProfile: true,
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

export const UserService = {
    getUserProfile,
}