import status from "http-status";
import prisma from "../../utils/prisma";
import { UpdateAdminProfileInput } from "./admin.validation";
import { AppError } from "../../errors/AppError";
import { Role } from "@prisma/client";

// Get all admins with pagination and filtering
const getAllAdminsFromDB = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) => {
  const {
    page = 1,
    limit = 10,
    search,
    isActive,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = params;

  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {
    role: 'ADMIN',
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

  // Build orderBy
  const orderBy: any = {};
  if (sortBy === 'name' || sortBy === 'email' || sortBy === 'createdAt' || sortBy === 'lastLoginAt') {
    orderBy[sortBy] = sortOrder;
  } else if (sortBy === 'department' || sortBy === 'position') {
    orderBy.adminProfile = { [sortBy]: sortOrder };
  } else {
    orderBy.createdAt = 'desc'; // default
  }

  // Execute queries
  const [admins, total] = await Promise.all([
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
        adminProfile: {
          select: {
            id: true,
            department: true,
            designation: true,
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
    admins,
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

// Get admin by ID
const getAdminByIdFromDB = async (userId: string) => {
  const admin = await prisma.user.findFirst({
    where: {
      id: userId,
      role: Role.ADMIN,
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
      adminProfile: {
        select: {
          id: true,
          department: true,
          designation: true,
          createdAt: true,
          updatedAt: true,
        }
      },
    },
  });

  if (!admin) {
    throw new AppError("Admin not found", status.NOT_FOUND);
  }

  return admin;
};

// Update admin profile  
export const updateAdminProfile = async (
  userId: string,
  profileData: UpdateAdminProfileInput
) => {
  // Check if user is admin
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      role: 'ADMIN',
      isActive: true,
      isDeleted: false,
    }
  });

  if (!user) {
    throw new AppError("Admin not found", status.NOT_FOUND);
  }

  // Update admin profile
  const updatedProfile = await prisma.adminProfile.update({
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

export const AdminService = {
    getAllAdminsFromDB,
    getAdminByIdFromDB,
    updateAdminProfile,
}