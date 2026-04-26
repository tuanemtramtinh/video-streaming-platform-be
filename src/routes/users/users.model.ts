import z from 'zod';

export const UserProfileSchema = z.object({
    id: z.number(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    createdAt: z.date(),
    updatedAt: z.date(),
    roles: z.array(z.string()),
});

export type UserProfileType = z.infer<typeof UserProfileSchema>;

export const UpdateProfileBodySchema = z
    .object({
        firstName: z.string().trim().min(1, 'First name is required').optional(),
        lastName: z.string().trim().min(1, 'Last name is required').optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
        message: 'At least one field must be provided',
    });

export type UpdateProfileBodyType = z.infer<typeof UpdateProfileBodySchema>;

export const UpdateProfileResSchema = UserProfileSchema;

export type UpdateProfileResType = z.infer<typeof UpdateProfileResSchema>;
