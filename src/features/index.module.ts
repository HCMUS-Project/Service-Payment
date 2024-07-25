import { Module } from '@nestjs/common';
import { BankModule } from './bank/bank.module';
import { PaymentModule } from './payment/payment.module';
import { PaymentMethodModule } from './payment_method/payment_method.module';
import { ExternalServiceModule } from './external_services/external.module';

@Module({ imports: [BankModule, PaymentMethodModule, PaymentModule, ExternalServiceModule] })
export class FeaturesModule {}
