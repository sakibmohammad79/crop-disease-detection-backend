// modules/auth/auth.route.ts
import { Router } from 'express';
import * as authController from './auth.controller';

import {
  registerFarmerSchema,
  registerAdminSchema,
  loginSchema,
  changePasswordSchema,
  updateProfileSchema,
} from './auth.validation';
import { validateRequest } from '../../middlewares/validateRequest';
import { authGuard } from '../../middlewares/authGuard';
import { roleGuard } from '../../middlewares/roleGuard';
import { Role } from '../../../generated/prisma';

const router = Router();

/**
 * ============================
 * 🔓 Public routes (no auth required)
 * ============================
 */
router.post(
  '/register/farmer',
  validateRequest(registerFarmerSchema),
  authController.registerFarmer
);

router.post(
  '/login',
  validateRequest(loginSchema),
  authController.login
);

router.post(
  '/logout',
  authController.logout
);

/**
 * ============================
 * 🔐 Protected routes (auth required)
 * ============================
 */
router.use(authGuard); // apply to all routes below this line

router.get(
  '/profile',
  authController.getMyProfile
);

router.put(
  '/profile',
  validateRequest(updateProfileSchema),
  authController.updateProfile
);

router.post(
  '/change-password',
  validateRequest(changePasswordSchema),
  authController.changePassword
);

router.post(
  '/deactivate',
  authController.deactivateAccount
);

/**
 * ============================
 * 👑 Admin-only routes
 * ============================
 */
router.post(
  '/register/admin',
  roleGuard([Role.ADMIN]),
  validateRequest(registerAdminSchema),
  authController.registerAdmin
);

router.get(
  '/users',
  roleGuard([Role.ADMIN]),
  authController.getAllUsers
);

export const authRoutes = router;
