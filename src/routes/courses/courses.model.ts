import z from 'zod';

export const CourseStatusSchema = z.enum(['active', 'inactive', 'draft']);

export const CourseSchema = z.object({
    id: z.number(),
    instructorId: z.number(),
    categoryId: z.number(),
    title: z.string(),
    description: z.string(),
    thumbnailUrl: z.string(),
    status: CourseStatusSchema,
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type CourseType = z.infer<typeof CourseSchema>;

export const UpdateCourseBodySchema = CourseSchema.pick({
    categoryId: true,
    title: true,
    description: true,
    thumbnailUrl: true,
    status: true,
})
    .partial()
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
        message: 'At least one field must be provided',
    });

export type UpdateCourseBodyType = z.infer<typeof UpdateCourseBodySchema>;

export const DeleteCourseResSchema = z.object({
    message: z.string(),
});

export type DeleteCourseResType = z.infer<typeof DeleteCourseResSchema>;
