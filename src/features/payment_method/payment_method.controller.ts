import { Controller } from '@nestjs/common';
import { PaymentMethodService } from './payment_method.service';
import {
    ICreatePaymentMethodRequest,
    ICreatePaymentMethodResponse,
    IDeletePaymentMethodRequest,
    IDeletePaymentMethodResponse,
    IGetPaymentMethodRequest,
    IGetPaymentMethodResponse,
    IListPaymentMethodRequest,
    IListPaymentMethodResponse,
    IUpdatePaymentMethodRequest,
    IUpdatePaymentMethodResponse,
} from './interfaces/payment_method.interface';
import { GrpcMethod } from '@nestjs/microservices';

@Controller()
export class PaymentMethodController {
    constructor(private readonly paymentMethodService: PaymentMethodService) {}

    @GrpcMethod('PaymentMethodService', 'CreatePaymentMethod')
    async create(data: ICreatePaymentMethodRequest): Promise<ICreatePaymentMethodResponse> {
        return await this.paymentMethodService.createPaymentMethod(data);
    }

    @GrpcMethod('PaymentMethodService', 'GetPaymentMethod')
    async findOne(data: IGetPaymentMethodRequest): Promise<IGetPaymentMethodResponse> {
        return await this.paymentMethodService.getPaymentMethod(data);
    }

    @GrpcMethod('PaymentMethodService', 'ListPaymentMethod')
    async find(data: IListPaymentMethodRequest): Promise<IListPaymentMethodResponse> {
        return await this.paymentMethodService.listPaymentMethod(data.user.domain);
    }

    @GrpcMethod('PaymentMethodService', 'UpdatePaymentMethod')
    async update(data: IUpdatePaymentMethodRequest): Promise<IUpdatePaymentMethodResponse> {
        return await this.paymentMethodService.updatePaymentMethod(data);
    }

    @GrpcMethod('PaymentMethodService', 'DeletePaymentMethod')
    async delete(data: IDeletePaymentMethodRequest): Promise<IDeletePaymentMethodResponse> {
        return await this.paymentMethodService.deletePaymentMethod(data);
    }
}
