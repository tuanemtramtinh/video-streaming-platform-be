import z from 'zod';
import { PaginationInput } from 'src/shared/models/pagination.model';
import { LessonSchema } from 'src/routes/lessons/lessons.model';
import { SectionSchema } from 'src/routes/sections/sections.model';

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

export const CourseWithRelationSchema = CourseSchema.extend({
  instructor: z.object({
    id: z.number(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
  }),
  category: z.object({
    id: z.number(),
    name: z.string(),
  }),
});

export type CourseWithRelationType = z.infer<typeof CourseWithRelationSchema>;

export const SectionWithLessonsSchema = SectionSchema.extend({
  lessons: z.array(LessonSchema),
});

export type SectionWithLessonsType = z.infer<typeof SectionWithLessonsSchema>;

export const CourseDetailWithSectionsAndLessonsSchema =
  CourseWithRelationSchema.extend({
    sections: z.array(SectionWithLessonsSchema),
  });

export type CourseDetailWithSectionsAndLessonsType = z.infer<
  typeof CourseDetailWithSectionsAndLessonsSchema
>;

export const CourseWithPaginationSchema = z.object({
  data: z.array(CourseWithRelationSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    lastPage: z.number(),
    hasNextPage: z.boolean(),
    hasPrevPage: z.boolean(),
  }),
});

export type CourseWithPaginationType = z.infer<
  typeof CourseWithPaginationSchema
>;

export const SearchCourseQuerySchema = PaginationInput.extend({
  name: z.string().trim().min(1, 'Course name is required'),
});

export type SearchCourseQueryType = z.infer<typeof SearchCourseQuerySchema>;

export const CreateCourseSchema = CourseSchema.omit({
  id: true,
  instructorId: true,
  createdAt: true,
  updatedAt: true,
  thumbnailUrl: true,
})
  .extend({
    status: CourseStatusSchema.default('active'),
  })
  .strict();

export type CreateCourseType = z.infer<typeof CreateCourseSchema>;

export const CreateCourseResSchema = CourseWithRelationSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateCourseResType = z.infer<typeof CreateCourseResSchema>;

export const UpdateCourseBodySchema = CourseWithRelationSchema.pick({
  title: true,
  description: true,
  status: true,
  price: true,
  discount: true,
  categoryId: true,
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

export const CourseWithIsEnrolledSchema = CourseWithRelationSchema.extend({
  isEnrolled: z.boolean(),
});

export type CourseWithIsEnrolledType = z.infer<typeof CourseWithIsEnrolledSchema>;

export const CourseWithIsEnrolledPaginationSchema = z.object({
  data: z.array(CourseWithIsEnrolledSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    lastPage: z.number(),
    hasNextPage: z.boolean(),
    hasPrevPage: z.boolean(),
  }),
});

export type CourseWithIsEnrolledPaginationType = z.infer<
  typeof CourseWithIsEnrolledPaginationSchema
>;

export const CourseDetailWithIsEnrolledSchema =
  CourseDetailWithSectionsAndLessonsSchema.extend({
    isEnrolled: z.boolean(),
  });

export type CourseDetailWithIsEnrolledType = z.infer<
  typeof CourseDetailWithIsEnrolledSchema
>;

export const EnrollmentListQuerySchema = PaginationInput.extend({
  search: z.string().trim().optional(),
  sortBy: z.enum(['enrolledAt', 'name']).default('enrolledAt'),
});

export type EnrollmentListQueryType = z.infer<typeof EnrollmentListQuerySchema>;

export const EnrollmentWithStudentSchema = z.object({
  userId: z.number(),
  courseId: z.number(),
  enrolledAt: z.date(),
  user: z.object({
    id: z.number(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
  }),
});

export type EnrollmentWithStudentType = z.infer<
  typeof EnrollmentWithStudentSchema
>;

export const EnrollmentListResSchema = z.object({
  data: z.array(EnrollmentWithStudentSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    lastPage: z.number(),
    hasNextPage: z.boolean(),
    hasPrevPage: z.boolean(),
  }),
});

export type EnrollmentListResType = z.infer<typeof EnrollmentListResSchema>;

export const StudentEnrollCourseSchema = z.object({
  userId: z.coerce.number(),
  courseId: z.coerce.number(),
  enrolledAt: z.date(),
});

export type StudentEnrollCourseType = z.infer<typeof StudentEnrollCourseSchema>;

export const StudentEnrollCourseRelationSchema =
  StudentEnrollCourseSchema.extend({
    course: z.object({
      id: z.number(),
      title: z.string(),
      description: z.string(),
      thumbnailUrl: z.string(),
      status: CourseStatusSchema,
    }),
    user: z.object({
      id: z.number(),
      firstName: z.string(),
      lastName: z.string(),
      email: z.string(),
    }),
  });

export type StudentEnrollCourseRelationType = z.infer<
  typeof StudentEnrollCourseRelationSchema
>;

export const StudentEnrollCoursePaginationSchema = z.object({
  data: z.array(StudentEnrollCourseRelationSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    lastPage: z.number(),
    hasNextPage: z.boolean(),
    hasPrevPage: z.boolean(),
  }),
});

export type StudentEnrollCoursePaginationType = z.infer<
  typeof StudentEnrollCoursePaginationSchema
>;

export const CreateStudentEnrollCouseSchema = StudentEnrollCourseSchema.omit({
  enrolledAt: true,
}).strict();

export type CreateStudentEnrollCourseType = z.infer<
  typeof CreateStudentEnrollCouseSchema
>;
