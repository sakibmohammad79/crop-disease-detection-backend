import { Router } from "express";
import { authGuard } from "../../middlewares/authGuard";
import { UserController } from "./user.controller";
import { roleGuard } from "../../middlewares/roleGuard";
import { Role } from "@prisma/client";

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