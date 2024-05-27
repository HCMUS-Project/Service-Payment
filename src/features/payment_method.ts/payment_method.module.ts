import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/core/prisma/prisma.module';
import { PaymentMethodController } from './payment_method.controller';
import { PaymentMethodService } from './payment_method.service';

@Module({
    imports: [PrismaModule],
    controllers: [PaymentMethodController],
    providers: [PaymentMethodService],
})
export class PaymentMethodModule {}
