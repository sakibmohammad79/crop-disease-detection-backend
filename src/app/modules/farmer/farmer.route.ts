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
router.get(
  '/farmer-stats',
  // roleGuard([Role.FARMER]),
  FarmerController.getFarmersStats
);



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
  '/:cropType',
  roleGuard([Role.ADMIN, Role.FARMER]),
  FarmerController.getFarmersByCropType
);

router.get(
  '/',
  roleGuard([Role.ADMIN]),
  FarmerController.getAllFarmers
);

router.get(
  '/userId',
  roleGuard([Role.FARMER]),
  FarmerController.getFarmerById
);

router.get(
  '/farmer-stats',
  roleGuard([Role.FARMER, Role.ADMIN]),
  FarmerController.getFarmersStats
);

router.patch(
  '/',
  roleGuard([Role.FARMER]),
  validateRequest(FarmerValidationSchemas.updateFarmerProfileSchema),
  FarmerController.updateFarmerProfile
);

export const FarmerRoutes = router;
