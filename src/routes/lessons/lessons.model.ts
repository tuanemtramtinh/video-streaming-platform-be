import z from 'zod';
import { PaginationInput } from 'src/shared/models/pagination.model';

export const LessonStatusSchema = z.enum(['active', 'inactive']);
export type LessonStatusType = z.infer<typeof LessonStatusSchema>;

export const LessonTypeSchema = z.enum(['video', 'document', 'quiz']);
export type LessonTypeType = z.infer<typeof LessonTypeSchema>;

export const LessonSchema = z.object({
    id: z.number(),
    sectionId: z.coerce.number(),
    title: z
        .string()
        .min(1, 'Title is required')
        .max(255, 'Title must be less than 255 characters'),
    contentUrl: z.string().url('Invalid content url').or(z.literal('')).default(''),
    contentText: z
        .string()
        .min(1, 'Content text is required')
        .max(5000, 'Content text must be less than 5000 characters'),
    lessonType: LessonTypeSchema,
    orderIndex: z.coerce.number().int().positive('Order index must be greater than 0'),
    status: LessonStatusSchema,
});

export type LessonType = z.infer<typeof LessonSchema>;

export const LessonWithRelationSchema = LessonSchema.extend({
    section: z.object({
        id: z.number(),
        title: z.string(),
        courseId: z.number(),
    }),
});

export type LessonWithRelationType = z.infer<typeof LessonWithRelationSchema>;

export const LessonWithPaginationSchema = z.object({
    data: z.array(LessonWithRelationSchema),
    meta: z.object({
        total: z.number(),
        page: z.number(),
        lastPage: z.number(),
        hasNextPage: z.boolean(),
        hasPrevPage: z.boolean(),
    }),
});

export type LessonWithPaginationType = z.infer<typeof LessonWithPaginationSchema>;

export const LessonPaginationQuerySchema = PaginationInput.extend({
    sectionId: z.coerce
        .number()
        .int()
        .positive('Section id must be greater than 0')
        .optional(),
});

export type LessonPaginationQueryType = z.infer<typeof LessonPaginationQuerySchema>;

export const CreateLessonSchema = LessonSchema.omit({
    id: true,
    status: true,
}).extend({
    status: LessonStatusSchema.default('active'),
    contentUrl: z.string().url('Invalid content url').or(z.literal('')).default(''),
});

export type CreateLessonType = z.infer<typeof CreateLessonSchema>;

export const CreateLessonResSchema = LessonWithRelationSchema;

export type CreateLessonResType = z.infer<typeof CreateLessonResSchema>;

export const UpdateLessonBodySchema = LessonSchema.pick({
    title: true,
    contentUrl: true,
    contentText: true,
    lessonType: true,
    orderIndex: true,
    status: true,
    sectionId: true,
})
    .partial()
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
        message: 'At least one field must be provided',
    });

export type UpdateLessonBodyType = z.infer<typeof UpdateLessonBodySchema>;

export const DeleteLessonResSchema = z.object({
    message: z.string(),
});

export type DeleteLessonResType = z.infer<typeof DeleteLessonResSchema>;
