import { Injectable } from '@nestjs/common';
import { PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from 'src/shared/services/prisma.service';

@Injectable()
export class PaymentsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  private readonly paymentInclude = {
    course: {
      select: {
        id: true,
        title: true,
        thumbnailUrl: true,
        price: true,
        discount: true,
      },
    },
  } as const;

  async findCourseForPayment(courseId: number) {
    return this.prismaService.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        thumbnailUrl: true,
        price: true,
        discount: true,
        status: true,
        instructorId: true,
      },
    });
  }

  async hasEnrollment(userId: number, courseId: number) {
    const enrollment = await this.prismaService.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    return Boolean(enrollment);
  }

  async findReusablePendingPayment(userId: number, courseId: number) {
    return this.prismaService.payment.findFirst({
      where: {
        userId,
        courseId,
        status: {
          in: [PaymentStatus.pending, PaymentStatus.processing],
        },
        OR: [{ expiredAt: null }, { expiredAt: { gt: new Date() } }],
      },
      include: this.paymentInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async createPayment(data: Prisma.PaymentUncheckedCreateInput) {
    return this.prismaService.payment.create({
      data,
      include: this.paymentInclude,
    });
  }

  async createFreePaymentAndEnroll(data: Prisma.PaymentUncheckedCreateInput) {
    return this.prismaService.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data,
        include: this.paymentInclude,
      });

      await tx.enrollment.upsert({
        where: {
          userId_courseId: {
            userId: data.userId,
            courseId: data.courseId,
          },
        },
        create: {
          userId: data.userId,
          courseId: data.courseId,
        },
        update: {},
      });

      return payment;
    });
  }

  async findByOrderCode(orderCode: string) {
    return this.prismaService.payment.findUnique({
      where: {
        orderCode,
      },
      include: this.paymentInclude,
    });
  }

  async updateByOrderCode(
    orderCode: string,
    data: Prisma.PaymentUncheckedUpdateInput,
  ) {
    return this.prismaService.payment.update({
      where: {
        orderCode,
      },
      data,
      include: this.paymentInclude,
    });
  }

  async markPaidAndEnroll(
    orderCode: string,
    data: Prisma.PaymentUncheckedUpdateInput,
  ) {
    return this.prismaService.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: {
          orderCode,
        },
      });

      if (!payment) {
        return null;
      }

      if (payment.status !== PaymentStatus.paid) {
        await tx.payment.update({
          where: {
            orderCode,
          },
          data: {
            ...data,
            status: PaymentStatus.paid,
            paidAt: new Date(),
          },
        });

        await tx.enrollment.upsert({
          where: {
            userId_courseId: {
              userId: payment.userId,
              courseId: payment.courseId,
            },
          },
          create: {
            userId: payment.userId,
            courseId: payment.courseId,
          },
          update: {},
        });
      }

      return tx.payment.findUnique({
        where: {
          orderCode,
        },
        include: this.paymentInclude,
      });
    });
  }

  async getPaymentsByUserId(userId: number, page: number, limit: number) {
    const safePage = Math.max(1, page);
    const skip = (safePage - 1) * limit;

    const [data, total] = await Promise.all([
      this.prismaService.payment.findMany({
        where: {
          userId,
        },
        include: this.paymentInclude,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prismaService.payment.count({
        where: {
          userId,
        },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page: safePage,
      },
    };
  }
}
