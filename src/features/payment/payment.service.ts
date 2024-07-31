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
import { PaymentMethodType, PaymentStatus } from 'src/common/enums/payment.enum';

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

        this.logger.info('Data create payment', { props: dataPayment });
        // check role user
        if (user.role.toString() === getEnumKeyByEnumValue(Role, Role.ADMIN))
            throw new GrpcPermissionDeniedException('PERMISSION_DENIED');

        // check order booking or order product
        if (dataPayment.orderProductsId.length === 0 && dataPayment.orderBookingId.length === 0)
            throw new GrpcInvalidArgumentException('ORDER_EMPTY');

        // check payment_method exist
        try {
            const paymentMethod = await this.prismaService.paymentMethod.findUnique({
                where: { id: dataPayment.paymentMethodId },
                select: { id: true, type: true },
            });
            if (!paymentMethod) throw new GrpcInvalidArgumentException('PAYMENT_METHOD_NOT_FOUND');
            // check payment method is COD
            if (paymentMethod.type.toUpperCase() === PaymentMethodType.COD)
                return {
                    paymentUrl: '',
                };
        } catch (error) {
            throw error;
        }

        // create order type with product code
        const orderType =
            dataPayment.orderProductsId.length > 0 ? ProductCode.Health_Beauty : ProductCode.Other;

        // create vnpay service
        // const vnpay = await this.vnpayService.createVnpayService(user.domain);
        const vnpay = await this.vnpayService.createVnpayService();

        const billId = this.vnpayService.generateBillId();

        let url = new URL(dataPayment.vnpReturnUrl);
        let vnpReturnUrl = url.origin + url.pathname;
        // vnpReturnUrl, (domain = dataPayment.vnpReturnUrl);

        let urlString = '';
        try {
            urlString = vnpay.buildPaymentUrl({
                vnp_Amount: Math.floor(dataPayment.amount),
                vnp_IpAddr: this.configService.get('vnpayIpAddr'),
                vnp_TxnRef: billId,
                vnp_OrderInfo: dataPayment.description,
                vnp_OrderType: orderType,
                // vnp_ReturnUrl: dataPayment.vnpReturnUrl,
                vnp_ReturnUrl: 'http://localhost:3000/',
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
                    // domain: "https://facebook.com",
                    domain: url.origin,
                    // domain: dataPayment.vnpReturnUrl,
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

    private async handleResultCallback(
        data: ICallbackVnPayRequest,
    ): Promise<ICallbackVnPayResponse> {
        try {
            const status =
                data.vnpResponseCode === '00'
                    ? PaymentStatus.SUCCESS.toLowerCase()
                    : PaymentStatus.FAILED.toLowerCase();
            const txn = await this.prismaService.transactions.findFirst({
                where: { bill_id: data.vnpTxnRef },
            });

            if (!txn) throw new GrpcInvalidArgumentException('TRANSACTION_NOT_FOUND');

            return {
                status: status,
                message: status,
                urlRedirect: txn.domain,
            };
        } catch (error) {
            throw error;
        }
    }

    private async handleCallbackIpn(data: ICallbackVnPayRequest): Promise<ICallbackVnPayResponse> {
        try {
            const vnpay = await this.vnpayService.createVnpayService();
            const checkIPN = vnpay.verifyIpnCall({
                vnp_Amount: data.vnpAmount,
                vnp_OrderInfo: data.vnpOrderInfo,
                vnp_ResponseCode: data.vnpResponseCode,
                vnp_TxnRef: data.vnpTxnRef,
                vnp_BankCode: data.vnpBankCode,
                vnp_BankTranNo: data.vnpBankTranNo,
                vnp_CardType: data.vnpCardType,
                vnp_PayDate: data.vnpPayDate,
                vnp_TransactionNo: data.vnpTransactionNo,
                vnp_SecureHash: data.vnpSecureHash,
                vnp_SecureHashType: HashAlgorithm.SHA256,
                vnp_TmnCode: vnpay.defaultConfig.vnp_TmnCode,
                vnp_TransactionStatus: data.vnpTransactionStatus,
            });

            this.logger.debug('Check ipn: ', { props: checkIPN });

            this.prismaService.transactions.update({
                where: { id: checkIPN.vnp_TxnRef },
                data: { status: checkIPN.isSuccess ? PaymentStatus.SUCCESS : PaymentStatus.FAILED },
            });

            return {
                rspCode: checkIPN.vnp_ResponseCode.toString(),
                rspMessage: checkIPN.message,
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Handles the callback for the payment URL.
     * @param data - The callback request data.
     * @returns A promise that resolves to the callback response.
     * @throws Throws an error if there is an issue with the callback.
     */
    async callbackPaymentUrl(data: ICallbackVnPayRequest): Promise<ICallbackVnPayResponse> {
        this.logger.debug('Data callback: ', { props: data });

        if (!data.isIpn) return await this.handleResultCallback(data);

        return await this.handleCallbackIpn(data);
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
