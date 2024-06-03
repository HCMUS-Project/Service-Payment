import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { PaymentService } from './payment.service';
import {
    ICallbackVnPayRequest,
    ICallbackVnPayResponse,
    ICreatePaymentUrlRequest,
    ICreatePaymentUrlResponse,
    IGetTransactionRequest,
    IGetTransactionResponse,
} from './interfaces/payment.interface';

@Controller()
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) {}

    @GrpcMethod('PaymentService', 'CreatePaymentUrl')
    async createPaymentUrl(data: ICreatePaymentUrlRequest): Promise<ICreatePaymentUrlResponse> {
        return await this.paymentService.createPaymentUrl(data);
    }

    @GrpcMethod('PaymentService', 'CallbackVnPay')
    async callbackVnPay(data: ICallbackVnPayRequest): Promise<ICallbackVnPayResponse> {
        return await this.paymentService.callbackPaymentUrl(data);
    }

    @GrpcMethod('PaymentService', 'GetTransaction')
    async getTransaction(data: IGetTransactionRequest): Promise<IGetTransactionResponse> {
        return await this.paymentService.getTransaction(data);
    }
}
