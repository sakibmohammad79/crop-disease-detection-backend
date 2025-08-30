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
import emailSender from '../../helpers/emailSender';


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
  const { currentPassword, newPassword, confirmPassword } = passwordData;

  // Validate confirm password
  if (newPassword !== confirmPassword) {
    throw new Error("New password and confirm password don't match");
  }

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

// forgot password
export const forgotPassword = async (payload: { email: string }) => {
  const userData = await prisma.user.findUnique({ 
    where: {
      email: payload.email,
      isActive: true,
      isDeleted: false,
    },
  });

 
  if (!userData) {
    return {
      success: true,
      message: "If email exists, reset link has been sent!",
    };
  }

  const resetPasswordToken = generateToken(
    { 
      email: userData.email, 
      role: userData.role,
      userId: userData.id,
    },
    config.password.reset_password_token_secret as Secret,
    config.password.reset_password_token_exp_in as string
  );

  const resetPasswordLink =
    config.password.reset_password_link +
    `?userId=${userData.id}&token=${resetPasswordToken}`;

  // HTML template
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Password Reset Request</h2>
      <p>Dear ${userData.name || 'User'},</p>
      <p>You requested to reset your password. Click the button below to reset:</p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${resetPasswordLink}" 
           style="background-color: #007bff; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 4px; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p><strong>This link will expire in ${config.password.reset_password_token_exp_in}.</strong></p>
      <p>If you didn't request this, please ignore this email.</p>
      <hr>
      <p><small>For security, do not share this link with anyone.</small></p>
    </div>
  `;
  
  await emailSender(userData.email, html);

  return {
    success: true,
    message: "If email exists, reset link has been sent!",
    resetLink: resetPasswordLink, 
  };
};
