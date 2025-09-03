import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest";
import { FarmerValidationSchemas } from "./farmer.validation";
import { FarmerController } from "./farmer.controller";
import { authGuard } from "../../middlewares/authGuard";
import { roleGuard } from "../../middlewares/roleGuard";
import { Role } from "@prisma/client";

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
router.patch(
  '/',
  roleGuard([Role.FARMER]),
  validateRequest(FarmerValidationSchemas.updateFarmerProfileSchema),
  FarmerController.updateFarmerProfile
);

export const FarmerRoutes = router;
