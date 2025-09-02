import { Router } from "express";
import { authGuard } from "../../middlewares/authGuard";
import { UserController } from "./user.controller";

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

export const UserRoutes = router;