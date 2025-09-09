
import express from 'express';
import { ImageController } from './image.controller';
import { ImageValidation } from './image.validation';
import { upload } from '../../middlewares/upload';
import { validateRequest } from '../../middlewares/validateRequest';
import { roleGuard } from '../../middlewares/roleGuard';
import { Role } from '@prisma/client';
import { authGuard } from '../../middlewares/authGuard';

const router = express.Router();

//protected route
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

// Get all images - admin only
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

// Serve image file (original, processed, thumbnail) - redirects to Cloudinary URLs
router.get(
  '/:id/serve/:type',
  roleGuard([Role.ADMIN, Role.FARMER]),
  validateRequest(ImageValidation.serveImageValidation),
  ImageController.serveImage
);

// Serve image file - default to original
router.get(
  '/:id/serve',
  roleGuard([Role.ADMIN, Role.FARMER]),
  (req: any, res: any, next: any) => {
    req.params.type = 'original';
    next();
  },
  validateRequest(ImageValidation.serveImageValidation),
  ImageController.serveImage
);

// Download image file - force download with proper filename
router.get(
  '/:id/download/:type',
 roleGuard([Role.ADMIN, Role.FARMER]),
  validateRequest(ImageValidation.downloadImageValidation),
  ImageController.downloadImage
);

// Download image file - default to original
router.get(
  '/:id/download',
  roleGuard([Role.ADMIN, Role.FARMER]),
  (req: any, res: any, next: any) => {
    req.params.type = 'original';
    next();
  },
  validateRequest(ImageValidation.downloadImageValidation),
  ImageController.downloadImage
);

// Reprocess image (admin only) - limited functionality with Cloudinary
router.post(
  '/:id/reprocess',
  roleGuard([Role.ADMIN]),
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