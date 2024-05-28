import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { VnPayFactoryService } from './vnpay.service';
import { PrismaModule } from 'src/core/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [PaymentController],
    providers: [PaymentService, VnPayFactoryService],
})
export class PaymentModule {}
