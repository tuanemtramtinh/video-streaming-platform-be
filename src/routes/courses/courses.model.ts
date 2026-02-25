import z from 'zod';

export const CourseStatusSchema = z.enum(['active', 'inactive', 'draft']);
export type CourseStatusType = z.infer<typeof CourseStatusSchema>;

export const CourseSchema = z.object({
  id: z.number(),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be less than 255 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  thumbnailUrl: z.url('Invalid thumbnail url').optional(),
  instructorId: z.number(),
  categoryId: z.number(),
  status: CourseStatusSchema.default('draft'),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CourseType = z.infer<typeof CourseSchema>;

export const CreateCourseSchema = CourseSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).strict();

export type CreateCourseType = z.infer<typeof CreateCourseSchema>;
