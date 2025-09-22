// src/app/modules/ml/ml.routes.ts
import express from 'express';
import { MLController } from './ml.controller';
import { authGuard } from '../../middlewares/authGuard';
import { roleGuard } from '../../middlewares/roleGuard';
import { Role } from '@prisma/client';
import { validateRequest } from '../../middlewares/validateRequest';
import { MLValidation } from './ml.validation';


const router = express.Router();

router.use(authGuard);

// ML service health check - accessible to authenticated users
router.get(
  '/health',
  roleGuard([Role.ADMIN, Role.ADMIN]),
  MLController.checkMLHealth
);

// Get ML service information
router.get(
  '/info',
  roleGuard([Role.ADMIN, Role.ADMIN]),
  MLController.getMLServiceInfo
);

// Predict disease for a specific image
router.post(
  '/predict/:imageId',
  roleGuard([Role.ADMIN, Role.ADMIN]),
  MLController.predictImageDisease
);

// Batch prediction for multiple images
router.post(
  '/batch-predict',
  roleGuard([Role.ADMIN, Role.ADMIN]),
  validateRequest(MLValidation.batchPredictValidation),
  MLController.batchPredict
);

export const MLRoutes = router;