import { CourseStatusSchema } from '../courses/courses.model';
import z from 'zod';

export const SectionStatusSchema = z.enum(['active', 'inactive']);
export type SectionStatusType = z.infer<typeof SectionStatusSchema>;

export const SectionSchema = z.object({
  id: z.number(),
  courseId: z.coerce.number(),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be less than 255 characters'),
  orderIndex: z.coerce.number().int().min(0),
  status: SectionStatusSchema,
});

export type SectionType = z.infer<typeof SectionSchema>;

export const SectionWithRelationSchema = SectionSchema.extend({
  course: z.object({
    id: z.number(),
    title: z.string(),
    description: z.string(),
    thumbnailUrl: z.string(),
    price: z.number(),
    discount: z.number(),
    status: CourseStatusSchema,
  }),
});

export type SectionWithRelationType = z.infer<typeof SectionWithRelationSchema>;

export const SectionWithPaginationSchema = z.object({
  data: z.array(SectionWithRelationSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    lastPage: z.number(),
    hasNextPage: z.boolean(),
    hasPrevPage: z.boolean(),
  }),
});

export type SectionWithPaginationType = z.infer<
  typeof SectionWithPaginationSchema
>;

export const CreateSectionSchema = SectionSchema.omit({
  id: true,
})
  .extend({
    status: SectionStatusSchema.default('active'),
  })
  .strict();

export type CreateSectionType = z.infer<typeof CreateSectionSchema>;

export const CreateSectionResSchema = SectionWithRelationSchema.omit({
  id: true,
});

export type CreateSectionResType = z.infer<typeof CreateSectionResSchema>;

export const UpdateSectionSchema = SectionSchema.pick({
  title: true,
  orderIndex: true,
  status: true,
})
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export type UpdateSectionType = z.infer<typeof UpdateSectionSchema>;

export const DeleteSectionResSchema = z.object({
  message: z.string(),
});

export type DeleteSectionResType = z.infer<typeof DeleteSectionResSchema>;
