import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PaymentStatus, Prisma } from '@prisma/client';
import type { PaymentLink, PaymentLinkStatus, Webhook } from '@payos/node';
import { ConfigService } from '@nestjs/config';
import { Config } from 'src/config/env.schema';
import {
  CancelPaymentBodyDTO,
  CreatePaymentBodyDTO,
  PayOSWebhookBodyDTO,
} from 'src/routes/payments/payments.dto';
import { PaymentsRepository } from 'src/routes/payments/payments.repo';
import { PayOSService } from 'src/routes/payments/payos.service';
import { PaginationType } from 'src/shared/models/pagination.model';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    private readonly payOSService: PayOSService,
    private readonly configService: ConfigService<Config>,
  ) {}

  private mapPayOSStatus(status: PaymentLinkStatus): PaymentStatus {
    switch (status) {
      case 'PAID':
        return PaymentStatus.paid;
      case 'PENDING':
        return PaymentStatus.pending;
      case 'PROCESSING':
        return PaymentStatus.processing;
      case 'CANCELLED':
        return PaymentStatus.cancelled;
      case 'EXPIRED':
        return PaymentStatus.expired;
      case 'FAILED':
      case 'UNDERPAID':
      default:
        return PaymentStatus.failed;
    }
  }

  private calculateFinalAmount(price: number, discount: number) {
    const normalizedDiscount = Math.min(100, Math.max(0, discount));
    const finalAmount = Math.max(
      0,
      Math.round(price - (price * normalizedDiscount) / 100),
    );

    return {
      discountPercent: normalizedDiscount,
      finalAmount,
    };
  }

  private generateOrderCode() {
    const randomSuffix = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');

    return Number(`${Date.now()}${randomSuffix}`);
  }

  private toOrderCodeNumber(orderCode: string) {
    const parsedOrderCode = Number(orderCode);

    if (!Number.isSafeInteger(parsedOrderCode) || parsedOrderCode <= 0) {
      throw new UnprocessableEntityException('Invalid order code');
    }

    return parsedOrderCode;
  }

  private buildPaymentDescription(courseId: number, userId: number) {
    return `COURSE${courseId}USER${userId}`.slice(0, 25);
  }

  private async applyGatewayStatus(
    orderCode: string,
    payosStatus: PaymentLinkStatus,
    gatewayPayment?: PaymentLink,
    webhookData?: PayOSWebhookBodyDTO,
  ) {
    const mappedStatus = this.mapPayOSStatus(payosStatus);

    const updateData: Prisma.PaymentUncheckedUpdateInput = {
      payosStatus,
      status: mappedStatus,
      paymentLinkId: gatewayPayment?.id,
    };

    if (gatewayPayment?.cancellationReason !== undefined) {
      updateData.failureReason = gatewayPayment.cancellationReason;
    }

    if (gatewayPayment?.canceledAt) {
      updateData.cancelledAt = new Date(gatewayPayment.canceledAt);
    }

    if (webhookData) {
      updateData.webhookData = webhookData as Prisma.InputJsonValue;
    }

    if (mappedStatus === PaymentStatus.paid) {
      return this.paymentsRepository.markPaidAndEnroll(orderCode, updateData);
    }

    return this.paymentsRepository.updateByOrderCode(orderCode, updateData);
  }

  private async syncPaymentFromPayOS(orderCode: string) {
    const paymentLink = await this.payOSService.client.paymentRequests.get(
      this.toOrderCodeNumber(orderCode),
    );

    const updatedPayment = await this.applyGatewayStatus(
      orderCode,
      paymentLink.status,
      paymentLink,
    );

    if (!updatedPayment) {
      throw new NotFoundException('Payment is not found');
    }

    return updatedPayment;
  }

  async createPayment(userId: number, req: CreatePaymentBodyDTO) {
    const course = await this.paymentsRepository.findCourseForPayment(
      req.courseId,
    );

    if (!course) {
      throw new NotFoundException('Course is not found');
    }

    if (course.status !== 'active') {
      throw new UnprocessableEntityException(
        'Course is not available for payment',
      );
    }

    if (course.instructorId === userId) {
      throw new ForbiddenException('You cannot buy your own course');
    }

    const hasEnrollment = await this.paymentsRepository.hasEnrollment(
      userId,
      req.courseId,
    );

    if (hasEnrollment) {
      throw new ConflictException('You already enrolled in this course');
    }

    const reusablePendingPayment =
      await this.paymentsRepository.findReusablePendingPayment(
        userId,
        req.courseId,
      );

    if (reusablePendingPayment?.checkoutUrl) {
      try {
        const synced = await this.syncPaymentFromPayOS(
          reusablePendingPayment.orderCode,
        );
        if (
          synced.status === PaymentStatus.pending ||
          synced.status === PaymentStatus.processing
        ) {
          return synced;
        }
      } catch {
        // sync failed, fall through to create new payment
      }
    }

    const { finalAmount, discountPercent } = this.calculateFinalAmount(
      course.price,
      course.discount,
    );

    const returnUrl = this.configService.get('PAYOS_RETURN_URL', {
      infer: true,
    });
    const cancelUrl = this.configService.get('PAYOS_CANCEL_URL', {
      infer: true,
    });

    if (!returnUrl || !cancelUrl) {
      throw new UnprocessableEntityException(
        'Missing PayOS return/cancel URL configuration',
      );
    }

    if (finalAmount === 0) {
      return this.paymentsRepository.createFreePaymentAndEnroll({
        orderCode: this.generateOrderCode().toString(),
        userId,
        courseId: course.id,
        originalAmount: course.price,
        finalAmount,
        discountPercent,
        status: PaymentStatus.paid,
        payosStatus: 'FREE',
        paidAt: new Date(),
      });
    }

    const paymentLink = await this.payOSService.client.paymentRequests.create({
      orderCode: this.generateOrderCode(),
      amount: finalAmount,
      description: this.buildPaymentDescription(course.id, userId),
      returnUrl,
      cancelUrl,
      items: [
        {
          name: course.title.slice(0, 25),
          quantity: 1,
          price: finalAmount,
        },
      ],
    });

    try {
      return await this.paymentsRepository.createPayment({
        orderCode: paymentLink.orderCode.toString(),
        paymentLinkId: paymentLink.paymentLinkId,
        userId,
        courseId: course.id,
        originalAmount: course.price,
        finalAmount,
        discountPercent,
        status: this.mapPayOSStatus(paymentLink.status),
        payosStatus: paymentLink.status,
        checkoutUrl: paymentLink.checkoutUrl,
        qrCode: paymentLink.qrCode,
        expiredAt: paymentLink.expiredAt
          ? new Date(paymentLink.expiredAt * 1000)
          : null,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Duplicate payment order code');
      }

      throw error;
    }
  }

  async getPaymentByOrderCode(userId: number, orderCode: string) {
    let payment = await this.paymentsRepository.findByOrderCode(orderCode);

    if (!payment) {
      throw new NotFoundException('Payment is not found');
    }

    if (payment.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this payment',
      );
    }

    if (
      payment.status === PaymentStatus.pending ||
      payment.status === PaymentStatus.processing
    ) {
      try {
        payment = await this.syncPaymentFromPayOS(orderCode);
      } catch {
        // Ignore sync errors and return the latest persisted payment state.
      }
    }

    return payment;
  }

  async getMyPayments(userId: number, pagination: PaginationType) {
    const { page, limit } = pagination;
    const { data, meta } = await this.paymentsRepository.getPaymentsByUserId(
      userId,
      page,
      limit,
    );

    const lastPage = Math.ceil(meta.total / limit);

    return {
      data,
      meta: {
        ...meta,
        lastPage,
        hasNextPage: page < lastPage,
        hasPrevPage: page > 1,
      },
    };
  }

  async cancelPayment(
    userId: number,
    orderCode: string,
    req: CancelPaymentBodyDTO,
  ) {
    const payment = await this.paymentsRepository.findByOrderCode(orderCode);

    if (!payment) {
      throw new NotFoundException('Payment is not found');
    }

    if (payment.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to cancel this payment',
      );
    }

    if (payment.status === PaymentStatus.paid) {
      throw new ConflictException('Paid payment cannot be cancelled');
    }

    if (
      payment.status === PaymentStatus.cancelled ||
      payment.status === PaymentStatus.expired ||
      payment.status === PaymentStatus.failed
    ) {
      throw new ConflictException('Payment is already finalized');
    }

    const cancelledPayment =
      await this.payOSService.client.paymentRequests.cancel(
        this.toOrderCodeNumber(orderCode),
        req.cancellationReason,
      );

    const updatedPayment = await this.applyGatewayStatus(
      orderCode,
      cancelledPayment.status,
      cancelledPayment,
    );

    if (!updatedPayment) {
      throw new NotFoundException('Payment is not found');
    }

    return updatedPayment;
  }

  async handlePayOSWebhook(webhookPayload: PayOSWebhookBodyDTO) {
    let verifiedWebhookData: Awaited<
      ReturnType<typeof this.payOSService.client.webhooks.verify>
    >;

    try {
      verifiedWebhookData = await this.payOSService.client.webhooks.verify(
        webhookPayload as Webhook,
      );
    } catch {
      throw new BadRequestException('Invalid webhook signature');
    }

    const orderCode = verifiedWebhookData.orderCode.toString();

    const existingPayment =
      await this.paymentsRepository.findByOrderCode(orderCode);

    if (!existingPayment) {
      return {
        message: 'Webhook received but payment is not found',
        orderCode,
      };
    }

    try {
      const paymentLink = await this.payOSService.client.paymentRequests.get(
        verifiedWebhookData.orderCode,
      );

      await this.applyGatewayStatus(
        orderCode,
        paymentLink.status,
        paymentLink,
        webhookPayload,
      );
    } catch {
      if (verifiedWebhookData.code === '00') {
        await this.paymentsRepository.markPaidAndEnroll(orderCode, {
          payosStatus: 'PAID',
          webhookData: webhookPayload as Prisma.InputJsonValue,
        });
      } else {
        await this.paymentsRepository.updateByOrderCode(orderCode, {
          status: PaymentStatus.processing,
          payosStatus: verifiedWebhookData.code,
          webhookData: webhookPayload as Prisma.InputJsonValue,
        });
      }
    }

    return {
      message: 'Webhook processed successfully',
      orderCode,
    };
  }

  async confirmWebhook(webhookUrl?: string) {
    const registeredWebhookUrl =
      webhookUrl ??
      this.configService.get('PAYOS_WEBHOOK_URL', { infer: true });

    if (!registeredWebhookUrl) {
      throw new UnprocessableEntityException('Webhook url is required');
    }

    try {
      return await this.payOSService.client.webhooks.confirm(
        registeredWebhookUrl,
      );
    } catch {
      throw new BadGatewayException('Unable to confirm webhook with PayOS');
    }
  }
}
