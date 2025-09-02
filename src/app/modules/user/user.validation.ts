import z from "zod";

// Update profile schema
const updateProfileSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(100, 'Name must be less than 100 characters')
      .optional(),
    phone: z
      .string()
      .regex(/^(\+8801|8801|01)[3-9]\d{8}$/, 'Invalid Bangladesh phone number')
      .optional(),
    address: z.string().optional(),
    photo: z.string().url('Invalid photo URL').optional(),
  })
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];

export const UserValidationSchemas = {
    updateProfileSchema
}