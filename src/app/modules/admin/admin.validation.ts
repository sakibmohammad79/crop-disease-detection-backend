import z from "zod";

const updateAdminProfileSchema = z.object({
  body: z.object({
    department: z.string().optional(),
    designation: z.string().optional(),
  })
});

export type UpdateAdminProfileInput = z.infer<typeof updateAdminProfileSchema>['body'];

export  const AdminValidationSchemas = {
    updateAdminProfileSchema,
}