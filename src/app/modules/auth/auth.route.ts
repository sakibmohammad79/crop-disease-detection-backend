import { Router } from 'express';
import * as authController from './auth.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { authGuard } from '../../middlewares/authGuard';
import { roleGuard } from '../../middlewares/roleGuard';
import { Role } from '../../../generated/prisma';
import { AuthValidationSchemas } from './auth.validation';

const router = Router();

/**
 * ============================
 * 🔓 Public routes (no auth required)
 * ============================
 */
router.post(
  '/register/farmer',
  validateRequest(AuthValidationSchemas.registerFarmerSchema),
  authController.registerFarmer
);

router.post(
  '/login',
  validateRequest(AuthValidationSchemas.loginSchema),
  authController.login
);

router.post(
  '/refresh-token',
  authController.refreshToken
);

router.post(
  '/forgot-password',
  validateRequest(AuthValidationSchemas.forgotPasswordSchema),
  authController.forgotPasswordController
);

router.post(
  '/reset-password',
  validateRequest(AuthValidationSchemas.resetPasswordSchema),
  authController.resetPassword
);

/**
 * ============================
 * 🔐 Protected routes (auth required)
 * ============================
 */
router.use(authGuard); 

router.post(
  '/change-password',
  validateRequest(AuthValidationSchemas.changePasswordSchema),
  authController.changePassword
);

/**
 * ============================
 * 👑 Admin-only routes
 * ============================
 */
router.post(
  '/register/admin',
  roleGuard([Role.ADMIN]),
  validateRequest(AuthValidationSchemas.registerAdminSchema),
  authController.registerAdmin
);

export const authRoutes = router;
