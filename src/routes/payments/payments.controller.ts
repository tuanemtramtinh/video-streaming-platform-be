import {
    Body,
    Controller,
    Get,
    HttpCode,
    Param,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ZodSerializerDto } from 'nestjs-zod';
import {
    CancelPaymentBodyDTO,
    ConfirmWebhookBodyDTO,
    ConfirmWebhookResDTO,
    CreatePaymentBodyDTO,
    PaymentResDTO,
    PaymentWebhookResDTO,
    PaymentWithPaginationDTO,
    PayOSWebhookBodyDTO,
} from 'src/routes/payments/payments.dto';
import { PaymentsService } from 'src/routes/payments/payments.service';
import { REQUEST_USER_KEY } from 'src/shared/constants/auth.constant';
import { AuthGuard } from 'src/shared/guards/auth.guard';
import {
    PaginationSchema,
    type PaginationInputType,
} from 'src/shared/models/pagination.model';

type RequestWithUser = Request & {
    [REQUEST_USER_KEY]: {
        id: number;
    };
};

@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @UseGuards(AuthGuard)
    @Post('checkout')
    @HttpCode(201)
    @ZodSerializerDto(PaymentResDTO)
    createPayment(
        @Body() req: CreatePaymentBodyDTO,
        @Req() request: RequestWithUser,
    ) {
        return this.paymentsService.createPayment(
            request[REQUEST_USER_KEY].id,
            req,
        );
    }

    @UseGuards(AuthGuard)
    @Get('me')
    @HttpCode(200)
    @ZodSerializerDto(PaymentWithPaginationDTO)
    getMyPayments(
        @Req() request: RequestWithUser,
        @Query() query: PaginationInputType,
    ) {
        const validatedPagination = PaginationSchema.parse(query);
        return this.paymentsService.getMyPayments(
            request[REQUEST_USER_KEY].id,
            validatedPagination,
        );
    }

    @Post('webhook')
    @HttpCode(200)
    @ZodSerializerDto(PaymentWebhookResDTO)
    handlePayOSWebhook(@Body() req: PayOSWebhookBodyDTO) {
        return this.paymentsService.handlePayOSWebhook(req);
    }

    @Post('webhook/confirm')
    @HttpCode(200)
    @ZodSerializerDto(ConfirmWebhookResDTO)
    confirmWebhook(@Body() req: ConfirmWebhookBodyDTO) {
        return this.paymentsService.confirmWebhook(req.webhookUrl);
    }

    @UseGuards(AuthGuard)
    @Get(':orderCode')
    @HttpCode(200)
    @ZodSerializerDto(PaymentResDTO)
    getPaymentByOrderCode(
        @Param('orderCode') orderCode: string,
        @Req() request: RequestWithUser,
    ) {
        return this.paymentsService.getPaymentByOrderCode(
            request[REQUEST_USER_KEY].id,
            orderCode,
        );
    }

    @UseGuards(AuthGuard)
    @Post(':orderCode/cancel')
    @HttpCode(200)
    @ZodSerializerDto(PaymentResDTO)
    cancelPayment(
        @Param('orderCode') orderCode: string,
        @Body() req: CancelPaymentBodyDTO,
        @Req() request: RequestWithUser,
    ) {
        return this.paymentsService.cancelPayment(
            request[REQUEST_USER_KEY].id,
            orderCode,
            req,
        );
    }
}
