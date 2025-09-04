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

//Get all farmers with pagination and filtering
const getAllFarmersFromDB = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  cropType?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) => {
  const {
    page = 1,
    limit = 10,
    search,
    cropType,
    isActive,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = params;

  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {
    role: 'FARMER',
    isDeleted: false,
  };

  // Add active filter if provided
  if (typeof isActive === 'boolean') {
    where.isActive = isActive;
  }

  // Add search filter
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { address: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Add crop type filter
  if (cropType) {
    where.farmerProfile = {
      cropTypes: {
        has: cropType
      }
    };
  }

  // Build orderBy
  const orderBy: any = {};
  if (sortBy === 'name' || sortBy === 'email' || sortBy === 'createdAt' || sortBy === 'lastLoginAt') {
    orderBy[sortBy] = sortOrder;
  } else if (sortBy === 'farmSize' || sortBy === 'farmingExperience') {
    orderBy.farmerProfile = { [sortBy]: sortOrder };
  } else {
    orderBy.createdAt = 'desc'; // default
  }

  // Execute queries
  const [farmers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        photo: true,
        address: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        farmerProfile: {
          select: {
            id: true,
            cropTypes: true,
            farmSize: true,
            farmingExperience: true,
            farmLocation: true,
            soilType: true,
            irrigationType: true,
            createdAt: true,
            updatedAt: true,
          }
        },
      },
      orderBy,
    }),
    prisma.user.count({ where })
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    farmers,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    }
  };
};

// Get farmer by ID
const getFarmerByIdFromDB = async (userId: string) => {
  const farmer = await prisma.user.findFirst({
    where: {
      id: userId,
      role: 'FARMER',
      isDeleted: false,
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      photo: true,
      address: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      lastLoginAt: true,
      farmerProfile: {
        select: {
          id: true,
          cropTypes: true,
          farmSize: true,
          farmingExperience: true,
          farmLocation: true,
          soilType: true,
          irrigationType: true,
          createdAt: true,
          updatedAt: true,
        }
      },
    },
  });

  if (!farmer) {
    throw new AppError("Farmer not found", status.NOT_FOUND);
  }

  return farmer;
};

//Get farmers statistics (for dashboard)
const getFarmersStats = async () => {
  const [
    totalFarmers,
    activeFarmers,
    inactiveFarmers,
    recentFarmers,
    cropTypesStats
  ] = await Promise.all([
    // Total farmers
    prisma.user.count({
      where: { role: 'FARMER', isDeleted: false }
    }),
    
    // Active farmers
    prisma.user.count({
      where: { role: 'FARMER', isActive: true, isDeleted: false }
    }),
    
    // Inactive farmers
    prisma.user.count({
      where: { role: 'FARMER', isActive: false, isDeleted: false }
    }),
    
    // Recent farmers (last 30 days)
    prisma.user.count({
      where: {
        role: 'FARMER',
        isDeleted: false,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    }),
    
    // Crop types statistics
    prisma.farmerProfile.findMany({
      select: { cropTypes: true },
      where: {
        user: { isDeleted: false, isActive: true }
      }
    })
  ]);

  // Calculate crop types frequency
  const cropTypeFrequency: { [key: string]: number } = {};
  cropTypesStats.forEach(profile => {
    profile.cropTypes.forEach(crop => {
      cropTypeFrequency[crop] = (cropTypeFrequency[crop] || 0) + 1;
    });
  });

  // Sort crop types by frequency
  const topCropTypes = Object.entries(cropTypeFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([crop, count]) => ({ crop, count }));

  return {
    totalFarmers,
    activeFarmers,
    inactiveFarmers,
    recentFarmers,
    topCropTypes,
    activeFarmersPercentage: totalFarmers > 0 ? Math.round((activeFarmers / totalFarmers) * 100) : 0,
  };
};

const getFarmersByCropType = async (cropType: string, limit: number = 50) => {
  const farmers = await prisma.user.findMany({
    where: {
      role: 'FARMER',
      isActive: true,
      isDeleted: false,
      farmerProfile: {
        cropTypes: {
          has: cropType
        }
      }
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      farmerProfile: true,
    },
    take: limit,
    orderBy: { createdAt: 'desc' }
  });

  return farmers;
};


export const FarmerService = {
    updateFarmerProfile,
    getAllFarmersFromDB,
    getFarmerByIdFromDB,
    getFarmersStats,
    getFarmersByCropType,
}