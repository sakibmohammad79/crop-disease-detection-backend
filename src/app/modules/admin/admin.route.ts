import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest";
import { authGuard } from "../../middlewares/authGuard";
import { roleGuard } from "../../middlewares/roleGuard";
import { Role } from "@prisma/client";
import { AdminValidationSchemas } from "./admin.validation";
import { AdminController } from "./admin.controller";

const router = Router();

/**
 * ============================
 * 🔓 Public routes (no auth required)
 * ============================
 */




/**
 * ============================
 * 🔐 Protected routes (auth required)
 * ============================
 */
router.use(authGuard); 



/**
 * ============================
 * 👑 Farmer-only routes
 * ============================
 */

router.get(
  '/states',
  roleGuard([Role.ADMIN]),
  AdminController.getAdminsStats
);

router.get(
  '/',
  roleGuard([Role.ADMIN]),
  AdminController.getAllAdmins
);

router.get(
  '/:userId',
  roleGuard([Role.ADMIN]),
  AdminController.getAdminById
);
router.get(
  '/department/:department',
  roleGuard([Role.ADMIN]),
  AdminController.getAdminsByDepartment
);


router.patch(
  '/',
  roleGuard([Role.ADMIN]),
  validateRequest(AdminValidationSchemas.updateAdminProfileSchema),
  AdminController.updateAdminProfile
);

export const AdminRoutes = router;
