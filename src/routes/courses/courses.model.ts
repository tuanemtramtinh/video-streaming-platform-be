import z from 'zod';

export const CourseStatusSchema = z.enum(['active', 'inactive', 'draft']);
export type CourseStatusType = z.infer<typeof CourseStatusSchema>;

export const CourseSchema = z.object({
  id: z.number(),
  instructorId: z.coerce.number(),
  categoryId: z.coerce.number(),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be less than 255 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  thumbnailUrl: z.string(),
  price: z.coerce.number(),
  discount: z.coerce.number(),
  status: CourseStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CourseType = z.infer<typeof CourseSchema>;

export const CreateCourseSchema = CourseSchema.omit({
  id: true,
  instructorId: true,
  createdAt: true,
  updatedAt: true,
  thumbnailUrl: true,
})
  .extend({
    // thumbnailUrl: z.url('Invalid thumbnail url').optional(),
    status: CourseStatusSchema.default('active'),
  })
  .strict();

export type CreateCourseType = z.infer<typeof CreateCourseSchema>;

export const CreateCourseResSchema = CourseSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateCourseResType = z.infer<typeof CreateCourseResSchema>;

export const UpdateCourseBodySchema = CourseSchema.pick({
  categoryId: true,
  title: true,
  description: true,
  status: true,
})
  .extend({
    thumbnailUrl: z.string().url('Invalid thumbnail url').optional(),
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
