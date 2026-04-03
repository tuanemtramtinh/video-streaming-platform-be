import z from 'zod';

export const UploadResourceBodySchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileType: z.string().min(1, 'File type is required'),
});

export type UploadResourceBodyType = z.infer<typeof UploadResourceBodySchema>;

export const UploadResourceResSchema = z.object({
  url: z.url(),
  key: z.string(),
});

export type UploadResourceResType = z.infer<typeof UploadResourceResSchema>;

export const CreateResourceSchema = z.object({
  courseId: z.coerce
    .number()
    .int()
    .positive('Course id must be greater than 0'),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be less than 255 characters'),
  fileUrl: z.string().url('Invalid file url'),
  fileType: z.string().min(1, 'File type is required'),
  lessonIds: z.array(z.number().int().positive()).optional(),
});

export type CreateResourceType = z.infer<typeof CreateResourceSchema>;

export const CreateResourceResSchema = z.object({
  id: z.number(),
  courseId: z.number(),
  title: z.string(),
  fileUrl: z.string(),
  fileType: z.string(),
});

export type CreateResourceResType = z.infer<typeof CreateResourceResSchema>;

export const UpdateResourceSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be less than 255 characters')
    .optional(),
  lessonIds: z.array(z.number().int().positive()).optional(),
});

export type UpdateResourceType = z.infer<typeof UpdateResourceSchema>;

export const LessonByResourceSchema = z.object({
  lessonId: z.number(),
  resourceId: z.number(),
  lesson: z.object({
    id: z.number(),
    sectionId: z.number(),
    title: z.string(),
    contentUrl: z.string(),
    contentText: z.string(),
    lessonType: z.string(),
    orderIndex: z.number(),
    status: z.string(),
    videoStatus: z.string(),
  }),
});

export const LessonsByResourceResSchema = z.array(LessonByResourceSchema);

export type LessonsByResourceResType = z.infer<
  typeof LessonsByResourceResSchema
>;

