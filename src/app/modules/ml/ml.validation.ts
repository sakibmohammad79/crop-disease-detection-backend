// src/app/modules/ml/ml.validation.ts
import { z } from 'zod';

const predictImageValidation = z.object({
  params: z.object({
    imageId: z.string({
      error: 'Image ID is required',
    }).min(1, 'Image ID cannot be empty'),
  }),
});

const batchPredictValidation = z.object({
  body: z.object({
    imageIds: z
      .array(z.string().min(1, 'Image ID cannot be empty'))
      .min(1, 'At least one image ID is required')
      .max(10, 'Cannot process more than 10 images at once'),
  }),
});

export const MLValidation = {
  predictImageValidation,
  batchPredictValidation,
};