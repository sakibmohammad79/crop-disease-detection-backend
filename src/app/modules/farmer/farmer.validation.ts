import { z } from 'zod';

const updateFarmerProfileSchema = z.object({
  body: z.object({
    cropTypes: z
      .array(z.string())
      .min(1, 'At least one crop type is required')
      .optional(),
    farmSize: z
      .number()
      .positive('Farm size must be positive')
      .optional(),
    farmingExperience: z
      .number()
      .int()
      .min(0, 'Experience cannot be negative')
      .max(100, 'Experience seems unrealistic')
      .optional(),
    farmLocation: z.string().optional(),
    soilType: z
      .enum(['clay', 'sandy', 'loamy', 'silt', 'peat', 'chalk'])
      .optional(),
    irrigationType: z
      .enum(['drip', 'sprinkler', 'flood', 'manual', 'rainfed'])
      .optional(),
  })
});

export type UpdateFarmerProfileInput = z.infer<typeof updateFarmerProfileSchema>['body'];

export const FarmerValidationSchemas = {
  updateFarmerProfileSchema
}