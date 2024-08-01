import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { VnPayFactoryService } from './vnpay.service';
import { PrismaModule } from 'src/core/prisma/prisma.module';
import { ExternalTenantService } from '../external_services/tenant_service/tenant.service';
import { ExternalServiceModule } from '../external_services/external.module';

@Module({
    imports: [PrismaModule, ExternalServiceModule],
    controllers: [PaymentController],
    providers: [PaymentService, VnPayFactoryService, ExternalTenantService],
})
export class PaymentModule {}
