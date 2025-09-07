import { z } from 'zod';

const uploadImageValidation = z.object({
  body: z.object({}), // File validation is handled by multer
});

const getImagesValidation = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .refine((val) => !val || (parseInt(val) > 0), {
        message: 'Page must be a positive number',
      }),
    limit: z
      .string()
      .optional()
      .refine((val) => !val || (parseInt(val) > 0 && parseInt(val) <= 100), {
        message: 'Limit must be between 1 and 100',
      }),
    sortBy: z
      .enum(['uploadedAt', 'originalName', 'size'])
      .optional()
      .default('uploadedAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    search: z.string().optional(),
    userId: z.string().optional(),
    processingStatus: z
      .enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'])
      .optional(),
  }),
});

const getImageByIdValidation = z.object({
  params: z.object({
    id: z.string({
      error: 'Image ID is required',
    }).min(1, 'Image ID cannot be empty'),
  }),
});

const deleteImageValidation = z.object({
  params: z.object({
    id: z.string({
      error: 'Image ID is required',
    }).min(1, 'Image ID cannot be empty'),
  }),
});

const bulkDeleteValidation = z.object({
  body: z.object({
    imageIds: z
      .array(z.string().min(1, 'Image ID cannot be empty'))
      .min(1, 'At least one image ID is required')
      .max(50, 'Cannot delete more than 50 images at once'),
  }),
});

const downloadImageValidation = z.object({
  params: z.object({
    id: z.string({
      error: 'Image ID is required',
    }).min(1, 'Image ID cannot be empty'),
    type: z.enum(['original', 'processed', 'thumbnail']).optional(),
  }),
});

const serveImageValidation = z.object({
  params: z.object({
    id: z.string({
      error: 'Image ID is required',
    }).min(1, 'Image ID cannot be empty'),
    type: z.enum(['original', 'processed', 'thumbnail']).optional(),
  }),
});

const reprocessImageValidation = z.object({
  params: z.object({
    id: z.string({
      error: 'Image ID is required',
    }).min(1, 'Image ID cannot be empty'),
  }),
});

const getStatsValidation = z.object({
  query: z.object({
    userId: z.string().optional(),
  }),
});

// File validation middleware (to be used with multer)
const validateImageFile = (req: any, res: any, next: any) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Image file is required',
    });
  }

  // Check file type
  if (!req.file.mimetype.startsWith('image/')) {
    return res.status(400).json({
      success: false,
      message: 'Only image files are allowed',
    });
  }

  // Check file size (10MB max)
  if (req.file.size > 10 * 1024 * 1024) {
    return res.status(400).json({
      success: false,
      message: 'File size must be less than 10MB',
    });
  }

  // Check image dimensions (optional - can be done with sharp)
  const allowedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedFormats.includes(req.file.mimetype)) {
    return res.status(400).json({
      success: false,
      message: 'Only JPEG, PNG, and WebP formats are allowed',
    });
  }

  next();
};

export const ImageValidation = {
  uploadImageValidation,
  getImagesValidation,
  getImageByIdValidation,
  deleteImageValidation,
  bulkDeleteValidation,
  downloadImageValidation,
  serveImageValidation,
  reprocessImageValidation,
  getStatsValidation,
  validateImageFile,
};