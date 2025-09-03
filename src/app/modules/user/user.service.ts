
import { AppError } from "../../errors/AppError";
import prisma from "../../utils/prisma";
import status from "http-status";

// Get user profile
const getUserProfile = async (userId: string) => {
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

// Get all users (admin only)
const getAllUsers = async (params: {
  page?: number;
  limit?: number;
  role?: string;
  search?: string;
}) => {
  const { page = 1, limit = 10, role, search } = params;
  const skip = (page - 1) * limit;

  const where: any = {
    isDeleted: false,
  };

  if (role) {
    where.role = role;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        photo: true,
        address: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        farmerProfile: true,
        adminProfile: true,
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count({ where })
  ]);

  return {
    users,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }
  };
};

// Update user profile
const updateUser = async (
  userId: string, 
  updateData: { name?: string; phone?: string; address?: string; photo?: string }
) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
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

  return user;
};


// Get user by ID (admin only)
const getUserById = async (userId: string) => {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      isDeleted: false,
      isActive: true
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      photo: true,
      address: true,
      isActive: true,
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

// Toggle user status (admin only)
export const toggleUserStatus = async (userId: string, status: boolean) => {
  const existingUser = await prisma.user.findFirst({
    where: { id: userId, isDeleted: false }
  });

  if (!existingUser) {
    throw new AppError("user not found", 404)
  }
  const user = await prisma.user.update({
    where: { id: userId },
    data: { isActive: status },
    select: {
      id: true,
      email: true,
      name: true,
      isActive: true,
      role: true,
    }
  });

  return user;
};

// Delete user (soft delete - admin only)
export const userSoftDelete = async (userId: string) => {
  const existingUser = await prisma.user.findFirst({
    where: { id: userId, isDeleted: false }
  });

  if (!existingUser) {
    throw new AppError("User not found", 404);
  }
  const user = await prisma.user.update({
    where: { id: userId },
    data: { 
      isDeleted: true, 
      isActive: false,
      email: `deleted_${Date.now()}_${existingUser.email}` 
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    }
  });

  return user;
};



export const UserService = {
    getUserProfile,
    getAllUsers,
    updateUser,
    getUserById,
    toggleUserStatus,
    userSoftDelete,
}