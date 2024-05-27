import { Module } from '@nestjs/common';
import { BankModule } from './bank/bank.module';
import { PaymentMethodModule } from './payment_method.ts/payment_method.module';

@Module({ imports: [BankModule, PaymentMethodModule] })
export class FeaturesModule {}
