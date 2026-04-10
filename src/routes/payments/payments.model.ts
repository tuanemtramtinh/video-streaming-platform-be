import z from 'zod';

export const PaymentStatusSchema = z.enum([
  'pending',
  'processing',
  'paid',
  'cancelled',
  'expired',
  'failed',
]);

export type PaymentStatusType = z.infer<typeof PaymentStatusSchema>;

export const PaymentCourseSummarySchema = z.object({
  id: z.number(),
  title: z.string(),
  thumbnailUrl: z.string(),
  price: z.number(),
  discount: z.number(),
});

export type PaymentCourseSummaryType = z.infer<
  typeof PaymentCourseSummarySchema
>;

export const PaymentSchema = z.object({
  id: z.number(),
  orderCode: z.string(),
  paymentLinkId: z.string().nullable(),
  userId: z.number(),
  courseId: z.number(),
  originalAmount: z.number(),
  finalAmount: z.number(),
  discountPercent: z.number(),
  status: PaymentStatusSchema,
  payosStatus: z.string().nullable(),
  checkoutUrl: z.string().nullable(),
  qrCode: z.string().nullable(),
  failureReason: z.string().nullable(),
  expiredAt: z.date().nullable(),
  paidAt: z.date().nullable(),
  cancelledAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PaymentType = z.infer<typeof PaymentSchema>;

export const PaymentWithCourseSchema = PaymentSchema.extend({
  course: PaymentCourseSummarySchema,
});

export type PaymentWithCourseType = z.infer<typeof PaymentWithCourseSchema>;

export const CreatePaymentBodySchema = z
  .object({
    courseId: z.coerce.number().int().positive(),
  })
  .strict();

export type CreatePaymentBodyType = z.infer<typeof CreatePaymentBodySchema>;

export const CancelPaymentBodySchema = z
  .object({
    cancellationReason: z.string().trim().min(1).max(255).optional(),
  })
  .strict();

export type CancelPaymentBodyType = z.infer<typeof CancelPaymentBodySchema>;

export const PaymentWithPaginationSchema = z.object({
  data: z.array(PaymentWithCourseSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    lastPage: z.number(),
    hasNextPage: z.boolean(),
    hasPrevPage: z.boolean(),
  }),
});

export type PaymentWithPaginationType = z.infer<
  typeof PaymentWithPaginationSchema
>;

export const PayOSWebhookDataSchema = z
  .object({
    orderCode: z.coerce.number(),
    amount: z.coerce.number(),
    description: z.string(),
    accountNumber: z.string(),
    reference: z.string(),
    transactionDateTime: z.string(),
    currency: z.string(),
    paymentLinkId: z.string(),
    code: z.string(),
    desc: z.string(),
    counterAccountBankId: z.string().nullish(),
    counterAccountBankName: z.string().nullish(),
    counterAccountName: z.string().nullish(),
    counterAccountNumber: z.string().nullish(),
    virtualAccountName: z.string().nullish(),
    virtualAccountNumber: z.string().nullish(),
  })
  .passthrough();

export type PayOSWebhookDataType = z.infer<typeof PayOSWebhookDataSchema>;

export const PayOSWebhookBodySchema = z
  .object({
    code: z.string(),
    desc: z.string(),
    success: z.boolean(),
    data: PayOSWebhookDataSchema,
    signature: z.string(),
  })
  .passthrough();

export type PayOSWebhookBodyType = z.infer<typeof PayOSWebhookBodySchema>;

export const PaymentWebhookResSchema = z.object({
  message: z.string(),
  orderCode: z.string().optional(),
});

export type PaymentWebhookResType = z.infer<typeof PaymentWebhookResSchema>;

export const ConfirmWebhookBodySchema = z
  .object({
    webhookUrl: z.url().optional(),
  })
  .strict();

export type ConfirmWebhookBodyType = z.infer<typeof ConfirmWebhookBodySchema>;

export const ConfirmWebhookResSchema = z.object({
  webhookUrl: z.string(),
  accountName: z.string(),
  accountNumber: z.string(),
  name: z.string(),
  shortName: z.string(),
});

export type ConfirmWebhookResType = z.infer<typeof ConfirmWebhookResSchema>;
