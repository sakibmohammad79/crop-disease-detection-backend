import { Router } from "express";
import { authRoutes } from "../modules/auth/auth.route";
import { UserRoutes } from "../modules/user/user.route";
import { AdminRoutes } from "../modules/admin/admin.route";
import { FarmerRoutes } from "../modules/farmer/farmer.route";
import { ImageRoutes } from "../modules/images/image.routes";
import { MLRoutes } from "../modules/ml/ml.routes";
// import { ImageRoutes } from "../modules/images/image.routes";


const router = Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: authRoutes,
  },
  {
    path: "/user",
    route: UserRoutes,
  },
  {
    path: "/admin",
    route: AdminRoutes,
  },
  {
    path: "/farmer",
    route: FarmerRoutes,
  },
  {
    path: "/image",
    route: ImageRoutes,
  },
  {
    path: "/ml",
    route: MLRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
