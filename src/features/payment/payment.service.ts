import { Injectable } from '@nestjs/common';
import { VnPayFactoryService } from './vnpay.service';
import { HashAlgorithm, VnpLocale, ProductCode, VNPayConfig } from 'src/util/vnpay/src';
import {
    ICreatePaymentUrlRequest,
    ICreatePaymentUrlResponse,
} from './interfaces/payment.interface';
import { getEnumKeyByEnumValue } from 'src/util/convert_enum/get_key_enum';
import {
    GrpcInternalException,
    GrpcInvalidArgumentException,
    GrpcPermissionDeniedException,
} from 'nestjs-grpc-exceptions';
import { Role } from 'src/proto_build/auth/user_token_pb';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/core/prisma/prisma.service';

@Injectable()
export class PaymentService {
    constructor(
        private readonly vnpayService: VnPayFactoryService,
        private readonly configService: ConfigService,
        private readonly prismaService: PrismaService,
    ) {}

    async createPaymentUrl(data: ICreatePaymentUrlRequest): Promise<ICreatePaymentUrlResponse> {
        const { user, ...dataPayment } = data;

        // check role user
        if (user.role.toString() !== getEnumKeyByEnumValue(Role, Role.TENANT))
            throw new GrpcPermissionDeniedException('PERMISSION_DENIED');

        // check order booking or order product
        if (dataPayment.orderProductsId.length === 0 && dataPayment.orderBookingId.length === 0)
            throw new GrpcInvalidArgumentException('ORDER_EMPTY');

        // check payment_method exist
        try {
            if (
                (await this.prismaService.paymentMethod.count({
                    where: { id: dataPayment.paymentMethodId, domain: user.domain },
                })) === 0
            )
                throw new GrpcInvalidArgumentException('PAYMENT_METHOD_NOT_FOUND');
        } catch (error) {
            throw error;
        }

        // TODO: check order exit

        // create order type with product code
        const orderType =
            dataPayment.orderProductsId.length > 0 ? ProductCode.Health_Beauty : ProductCode.Other;

        // create vnpay service
        const vnpay = this.vnpayService.createVnpayService();

        const billId = this.vnpayService.generateBillId();

        let urlString = '';
        try {
            urlString = vnpay.buildPaymentUrl({
                vnp_Amount: dataPayment.amount,
                vnp_IpAddr: this.configService.get('vnpayIpAddr'),
                vnp_TxnRef: billId,
                vnp_OrderInfo: dataPayment.description,
                vnp_OrderType: orderType,
                vnp_ReturnUrl: this.configService.get('vnpayReturnUrl'),
                vnp_Locale: VnpLocale.VN,
            });
        } catch (error) {
            throw error;
        }

        // save payment transaction to database
        try {
            await this.prismaService.transactions.create({
                data: {
                    status: 'PENDING',
                    amount: dataPayment.amount,
                    description: dataPayment.description,
                    bill_id: billId,
                    order_id:
                        dataPayment.orderProductsId.length > 0
                            ? dataPayment.orderProductsId[0]
                            : dataPayment.orderBookingId[0],
                    user: user.email,
                    domain: user.domain,
                    payment_method: dataPayment.paymentMethodId,
                },
            });
        } catch (error) {
            throw new GrpcInternalException('INTERNAL_ERROR');
        }

        return {
            paymentUrl: urlString,
        };
    }
}
