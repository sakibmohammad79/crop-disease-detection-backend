import { Router } from "express";
import { authGuard } from "../../middlewares/authGuard";
import { UserController } from "./user.controller";
import { roleGuard } from "../../middlewares/roleGuard";
import { Role } from "@prisma/client";
import { validateRequest } from "../../middlewares/validateRequest";
import { UserValidationSchemas } from "./user.validation";

const router = Router();
/**
 * ============================
 * 🔐 Protected routes (auth required)
 * ============================
 */
router.use(authGuard); 

router.get(
  '/profile',
  UserController.getMyProfile
);

router.put(
  '/profile-update',
  validateRequest(UserValidationSchemas.updateProfileSchema),
  UserController.updateProfile
);

/**
 * ============================
 * 👑 Admin-only routes
 * ============================
 */

router.get(
  '/users',
  roleGuard([Role.ADMIN]),
  UserController.getAllUsers
);

router.get(
  '/:userId',
  roleGuard([Role.ADMIN]),
  UserController.getUserById
);

router.patch(
  '/:userId/status',
  roleGuard([Role.ADMIN]),
  UserController.toggleUserStatus
);

router.delete(
  '/:userId',
  roleGuard([Role.ADMIN]),
  UserController.userSoftteDelete
);

export const UserRoutes = router;