import { z } from 'zod';

//Base user registration schema
 const registerSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email('Invalid email format')
      .min(1, 'Email is required'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(50, 'Password must be less than 50 characters'),
    name: z
      .string()
      .min(1, 'Name is required')
      .max(100, 'Name must be less than 100 characters'),
    phone: z
      .string()
      .regex(/^(\+8801|8801|01)[3-9]\d{8}$/, 'Invalid Bangladesh phone number')
      .optional(),
    address: z.string().optional(),
    photo: z.string().url('Invalid photo URL').optional(),
  })
});

// Farmer registration schema
 const registerFarmerSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email('Invalid email format')
      .min(1, 'Email is required'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(50, 'Password must be less than 50 characters'),
    name: z
      .string()
      .min(1, 'Name is required')
      .max(100, 'Name must be less than 100 characters'),
    phone: z
      .string()
      .regex(/^(\+8801|8801|01)[3-9]\d{8}$/, 'Invalid Bangladesh phone number')
      .optional(),
    address: z.string().optional(),
    photo: z.string().url('Invalid photo URL').optional(),
    
    // Farmer profile data
    farmerProfile: z.object({
      cropTypes: z
        .array(z.string())
        .min(1, 'At least one crop type is required'),
      farmSize: z
        .number()
        .positive('Farm size must be positive')
        .optional(),
      farmingExperience: z
        .number()
        .int()
        .min(0, 'Experience cannot be negative')
        .max(100, 'Experience seems unrealistic')
        .optional(),
      farmLocation: z.string().optional(),
      soilType: z
        .enum(['clay', 'sandy', 'loamy', 'silt', 'peat', 'chalk'])
        .optional(),
      irrigationType: z
        .enum(['drip', 'sprinkler', 'flood', 'manual', 'rainfed'])
        .optional(),
    })
  })
});

// Admin registration schema  
 const registerAdminSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email('Invalid email format')
      .min(1, 'Email is required'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(50, 'Password must be less than 50 characters'),
    name: z
      .string()
      .min(1, 'Name is required')
      .max(100, 'Name must be less than 100 characters'),
    phone: z
      .string()
      .regex(/^(\+8801|8801|01)[3-9]\d{8}$/, 'Invalid Bangladesh phone number')
      .optional(),
    address: z.string().optional(),
    photo: z.string().url('Invalid photo URL').optional(),
  
    
    // Admin profile data
    adminProfile: z.object({
      department: z.string().optional(),
      designation: z.string().optional(),
    })
  })
});

// Login schema
const loginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email('Invalid email format')
      .min(1, 'Email is required'),
    password: z
      .string()
      .min(1, 'Password is required'),
  })
});

// Change password schema
const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z
      .string()
      .min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(6, 'New password must be at least 6 characters')
      .max(50, 'New password must be less than 50 characters'),
    confirmPassword: z
      .string()
      .min(1, 'Confirm password is required'),
  })
});

// Forgot password schema
 const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email('Invalid email format')
      .min(1, 'Email is required'),
  })
});

// Reset password schema
const resetPasswordSchema = z.object({
  body: z.object({
    token: z
      .string()
      .min(1, 'Reset token is required'),
    newPassword: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(50, 'Password must be less than 50 characters'),
    confirmPassword: z
      .string()
      .min(1, 'Confirm password is required'),
  })
});



// Export types
export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type RegisterFarmerInput = z.infer<typeof registerFarmerSchema>['body'];
export type RegisterAdminInput = z.infer<typeof registerAdminSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>['body'];
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>['body'];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>['body'];


export const AuthValidationSchemas = {
  registerFarmerSchema,
  registerAdminSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
}