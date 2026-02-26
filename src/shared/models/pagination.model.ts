import { z } from 'zod';

export const PaginationSchema = z.object({
  page: z.coerce
    .number()
    .int()
    .positive('Page must be greater than 0')
    .default(1),

  limit: z.coerce
    .number()
    .int()
    .positive('Limit must be greater than 0')
    .max(100, 'Cannot fetch more than 100 items')
    .default(10),
});

export type PaginationType = z.infer<typeof PaginationSchema>;

export const PaginationInput = z.object({
  page: z.coerce
    .number()
    .int()
    .positive('Page must be greater than 0')
    .default(1),
  limit: z.coerce
    .number()
    .int()
    .positive('Limit must be greater than 0')
    .default(10),
});

export type PaginationInputType = z.infer<typeof PaginationInput>;