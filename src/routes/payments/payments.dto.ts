import { createZodDto } from 'nestjs-zod';
import {
  CancelPaymentBodySchema,
  ConfirmWebhookBodySchema,
  ConfirmWebhookResSchema,
  CreatePaymentBodySchema,
  PaymentWebhookResSchema,
  PaymentWithCourseSchema,
  PaymentWithPaginationSchema,
  PayOSWebhookBodySchema,
} from 'src/routes/payments/payments.model';

export class CreatePaymentBodyDTO extends createZodDto(
  CreatePaymentBodySchema,
) {}

export class CancelPaymentBodyDTO extends createZodDto(
  CancelPaymentBodySchema,
) {}

export class PaymentResDTO extends createZodDto(PaymentWithCourseSchema) {}

export class PaymentWithPaginationDTO extends createZodDto(
  PaymentWithPaginationSchema,
) {}

export class PayOSWebhookBodyDTO extends createZodDto(PayOSWebhookBodySchema) {}

export class PaymentWebhookResDTO extends createZodDto(
  PaymentWebhookResSchema,
) {}

export class ConfirmWebhookBodyDTO extends createZodDto(
  ConfirmWebhookBodySchema,
) {}

export class ConfirmWebhookResDTO extends createZodDto(
  ConfirmWebhookResSchema,
) {}
