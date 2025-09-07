import express from 'express';
import { roleGuard } from '../../middlewares/roleGuard';
import { validateRequest } from '../../middlewares/validateRequest';
import { ImageValidation } from './image.validation';
import { Role } from '@prisma/client';
import { authGuard } from '../../middlewares/authGuard';
import { upload } from '../../middlewares/upload';
import { ImageController } from './image.controller';

const router = express.Router();

router.use(authGuard);

// Upload image - requires authentication
router.post(
  '/upload',
  roleGuard([Role.ADMIN, Role.FARMER]),
  upload.single('image'),
  ImageValidation.validateImageFile,
  validateRequest(ImageValidation.uploadImageValidation),
  ImageController.uploadImage
);

// Get all images - admin only or with filters
router.get(
  '/',
  roleGuard([Role.ADMIN]),
  validateRequest(ImageValidation.getImagesValidation),
  ImageController.getAllImages
);

// Get current user's images
router.get(
  '/my-images',
  roleGuard([Role.ADMIN, Role.FARMER]),
  validateRequest(ImageValidation.getImagesValidation),
  ImageController.getUserImages
);

// Get image statistics
router.get(
  '/stats',
  roleGuard([Role.ADMIN, Role.FARMER]),
  validateRequest(ImageValidation.getStatsValidation),
  ImageController.getImageStats
);

// Get image by ID
router.get(
  '/:id',
  roleGuard([Role.ADMIN, Role.FARMER]),
  validateRequest(ImageValidation.getImageByIdValidation),
  ImageController.getImageById
);

// Serve image file (original, processed, thumbnail) via query param
router.get(
  '/:id/serve',
  roleGuard([Role.ADMIN, Role.FARMER]),
  validateRequest(ImageValidation.serveImageValidation),
  ImageController.serveImage
);

// Download image file via query param
router.get(
  '/:id/download',
  roleGuard([Role.ADMIN, Role.FARMER]),
  validateRequest(ImageValidation.downloadImageValidation),
  ImageController.downloadImage
);

// Reprocess image (for ML pipeline)
router.post(
  '/:id/reprocess',
  roleGuard([Role.ADMIN, Role.FARMER]),
  validateRequest(ImageValidation.reprocessImageValidation),
  ImageController.reprocessImage
);

// Delete single image
router.delete(
  '/:id',
  roleGuard([Role.ADMIN, Role.FARMER]),
  validateRequest(ImageValidation.deleteImageValidation),
  ImageController.deleteImage
);

// Bulk delete images
router.delete(
  '/',
  roleGuard([Role.ADMIN, Role.FARMER]),
  validateRequest(ImageValidation.bulkDeleteValidation),
  ImageController.bulkDeleteImages
);

export const ImageRoutes = router;
