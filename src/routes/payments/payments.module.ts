import { Module } from '@nestjs/common';
import { PaymentsController } from 'src/routes/payments/payments.controller';
import { PaymentsRepository } from 'src/routes/payments/payments.repo';
import { PaymentsService } from 'src/routes/payments/payments.service';
import { PayOSService } from 'src/routes/payments/payos.service';
import { UserRepository } from 'src/routes/users/user.repo';

@Module({
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PaymentsRepository,
    PayOSService,
    UserRepository,
  ],
})
export class PaymentsModule {}
