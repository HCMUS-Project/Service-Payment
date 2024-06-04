import { Inject, Injectable } from '@nestjs/common';
import { VnPayFactoryService } from './vnpay.service';
import { HashAlgorithm, VnpLocale, ProductCode, VNPayConfig } from 'src/util/vnpay/src';
import {
    ICallbackVnPayRequest,
    ICallbackVnPayResponse,
    ICreatePaymentUrlRequest,
    ICreatePaymentUrlResponse,
    IGetTransactionRequest,
    IGetTransactionResponse,
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
import Logger, { LoggerKey } from 'src/core/logger/interfaces/logger.interface';

@Injectable()
export class PaymentService {
    constructor(
        private readonly vnpayService: VnPayFactoryService,
        private readonly configService: ConfigService,
        private readonly prismaService: PrismaService,
        @Inject(LoggerKey) private readonly logger: Logger,
    ) {}

    async createPaymentUrl(data: ICreatePaymentUrlRequest): Promise<ICreatePaymentUrlResponse> {
        const { user, ...dataPayment } = data;

        this.logger.info('dataPayment');
        // check role user
        if (user.role.toString() !== getEnumKeyByEnumValue(Role, Role.USER))
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
                vnp_ReturnUrl: dataPayment.vnpReturnUrl,
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

    async callbackPaymentUrl(data: ICallbackVnPayRequest): Promise<ICallbackVnPayResponse> {
        this.logger.info('Data callback: ', { props: data });

        // const vnpay = this.vnpayService.createVnpayService();

        // save payment transaction to database
        try {
            const txn = await this.prismaService.transactions.update({
                where: { bill_id: data.vnpTxnRef },
                data: {
                    status: data.vnpResponseCode === '00' ? 'SUCCESS' : 'FAILED',
                },
            });

            return {
                status: 'success',
                message: 'success',
                urlRedirect: txn.domain,
            };
        } catch (error) {
            throw error;
        }
    }

    async getTransaction(data: IGetTransactionRequest): Promise<IGetTransactionResponse> {
        const { user, ...dataFilter } = data;

        // check role user
        if (user.role.toString() !== getEnumKeyByEnumValue(Role, Role.USER))
            delete dataFilter.userEmail;
        // let query: DataFilter = { domain: user.domain };
        // if (dataFilter.userEmail) query = { ...query, user: dataFilter.userEmail };
        // if (dataFilter.orderId) query = { ...query, orderId: dataFilter.orderId };
        // if (dataFilter.paymentMethodId)
        //     query = { ...query, paymentMethodId: dataFilter.paymentMethodId };
        // if (dataFilter.status) query = { ...query, status: dataFilter.status };
        try {
            const transactions = await this.prismaService.transactions.findMany({
                where: {
                    AND: [
                        {
                            domain: user.domain,
                        },
                        dataFilter.status ? { status: dataFilter.status.toUpperCase() } : {},
                        dataFilter.orderId ? { order_id: dataFilter.orderId } : {},
                    ],
                },
            });
            return {
                transactions: transactions.map(transaction => ({
                    id: transaction.id,
                    status: transaction.status,
                    amount: transaction.amount,
                    description: transaction.description,
                    billId: transaction.bill_id,
                    orderId: transaction.order_id,
                    paymentMethodId: transaction.payment_method,
                    user: transaction.user,
                    domain: transaction.domain,
                    createdAt: transaction.created_at.toISOString(),
                    paymentMethodName: transaction.payment_method,
                })),
            };
        } catch (error) {
            throw error;
        }
    }
}
