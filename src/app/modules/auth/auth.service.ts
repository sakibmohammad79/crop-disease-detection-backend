import { comparePassword, hashPassword } from '../../utils/bcrypt';
import { generateRefreshToken, generateToken, verifyRefreshToken, verifyToken } from '../../utils/jwt';
import type { 
  LoginInput, 
  RegisterFarmerInput, 
  RegisterAdminInput,
  ChangePasswordInput 
} from './auth.validation';
import prisma from '../../utils/prisma';
import { Secret } from 'jsonwebtoken';
import { config } from '../../config';


export const registerFarmer = async (userData: RegisterFarmerInput) => {
  const { farmerProfile, ...userInfo } = userData;
  // Hash password
  const hashedPassword = await hashPassword(userInfo.password);
   // Create user with farmer profile using transaction
  const result = await prisma.$transaction(async (tx) => {
    const user = await prisma.user.create({
      data: {
        ...userInfo,
        password: hashedPassword,
        farmerProfile: {
        create: farmerProfile
        }
      },
      include: {
      farmerProfile: true,
      }
    });
    return user
  })
  // Remove password from response
  const { password, ...userWithoutPassword } = result;

  return {
    admin: userWithoutPassword,
  };
};


export const registerAdmin = async (userData: RegisterAdminInput) => {
  const { adminProfile, ...userInfo } = userData;
  // Hash password
  const hashedPassword = await hashPassword(userInfo.password);
  // Create user with admin profile
  const result = await prisma.$transaction(async(tx) => {
    const user = await prisma.user.create({
    data: {
        ...userInfo,
        password: hashedPassword,
        role: 'ADMIN',
        adminProfile: {
        create: adminProfile || {}
        }
      },
        include: {
        adminProfile: true,
      }
    });
  return user;
  })
  // Remove password from response
  const { password, ...userWithoutPassword } = result;
  return {
    user: userWithoutPassword,
  };
};

// Login user
export const loginUser = async (credentials: LoginInput) => {
  const { email, password } = credentials;

  // Find user with profiles
  const user = await prisma.user.findUnique({
    where: { 
      email,
      isActive: true,
      isDeleted: false ,
    },
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });


  // Generate access token
   const jwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateToken(
    jwtPayload,
    config.jwt.access_token_secret as Secret,
    config.jwt.access_token_secret_expires_in as string
  );
  // Generate refresh token
  
  const refreshToken = generateRefreshToken(
    jwtPayload,
    config.jwt.refresh_token_secret as Secret,
    config.jwt.refresh_token_secret_expires_in as string
  );

  return {
      accessToken,
      refreshToken,
      // needPasswordChange: user.needPasswordChange,
  };
};


export const refreshToken = async(token: string) => {
  
  let decodedData;
  
  try {
    decodedData =  verifyRefreshToken(
      token,
      config.jwt.refresh_token_secret as Secret
    );
  } catch (error) {
    throw new Error("You are not authorized!");
  }

  //check if user delete
  const userData = await prisma.user.findUniqueOrThrow({
    where: {
      email: decodedData?.email,
      isActive: true,
      isDeleted: false
    },
  });
  
  const jwtPayload = {
    userId: userData.id,
    email: userData.email,
    role: userData.role,
  };
  const accessToken = generateToken(
    jwtPayload,
    config.jwt.access_token_secret as Secret,
    config.jwt.access_token_secret_expires_in as string
  );

  return {
    accessToken,
    // needPasswordChange: userData.address,
  };
}

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

// Update user profile
export const updateUserProfile = async (
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

// Change password
export const changeUserPassword = async (
  userId: string, 
  passwordData: ChangePasswordInput
) => {
  const { currentPassword, newPassword } = passwordData;

  // Get current user
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Verify current password
  const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    throw new Error('Current password is incorrect');
  }

  // Hash new password
  const hashedNewPassword = await hashPassword(newPassword);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedNewPassword }
  });

  return { message: 'Password changed successfully' };
};

// Deactivate user account
export const deactivateUser = async (userId: string ) => {
  await prisma.user.update({
    where: { id: userId },
    data: { isActive: false }
  });

  return { message: 'Account deactivated successfully' };
};

// Get all users (admin only)
export const getAllUsers = async (params: {
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