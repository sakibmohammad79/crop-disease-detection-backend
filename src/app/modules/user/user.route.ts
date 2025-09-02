import { Router } from "express";
import { authGuard } from "../../middlewares/authGuard";
import { UserController } from "./user.controller";
import { roleGuard } from "../../middlewares/roleGuard";
import { Role } from "@prisma/client";
import { validateRequest } from "../../middlewares/validateRequest";
import { AuthValidationSchemas } from "../auth/auth.validation";

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
  validateRequest(AuthValidationSchemas.updateProfileSchema),
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

export const UserRoutes = router;