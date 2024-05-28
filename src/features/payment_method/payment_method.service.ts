import { PrismaService } from 'src/core/prisma/prisma.service';
import {
    ICreatePaymentMethodRequest,
    ICreatePaymentMethodResponse,
    IDeletePaymentMethodRequest,
    IDeletePaymentMethodResponse,
    IGetPaymentMethodRequest,
    IGetPaymentMethodResponse,
    IListPaymentMethodResponse,
    IUpdatePaymentMethodRequest,
    IUpdatePaymentMethodResponse,
} from './interfaces/payment_method.interface';
import { getEnumKeyByEnumValue } from 'src/util/convert_enum/get_key_enum';
import { GrpcPermissionDeniedException } from 'nestjs-grpc-exceptions';
import { Role } from 'src/proto_build/auth/user_token_pb';
import { Injectable } from '@nestjs/common';
import { GrpcItemExitException } from 'src/common/exceptions/exceptions';

@Injectable()
export class PaymentMethodService {
    constructor(private prismaService: PrismaService) {}

    async createPaymentMethod(
        data: ICreatePaymentMethodRequest,
    ): Promise<ICreatePaymentMethodResponse> {
        const { user, ...dataCreate } = data;

        // check role tenant
        if (user.role.toString() !== getEnumKeyByEnumValue(Role, Role.TENANT))
            throw new GrpcPermissionDeniedException('PERMISSION_DENIED');

        // Create payment_method
        const paymentMethod = await this.prismaService.paymentMethod.create({
            data: {
                ...dataCreate,
                domain: user.domain,
            },
        });

        return paymentMethod;
    }

    async getPaymentMethod(data: IGetPaymentMethodRequest): Promise<IGetPaymentMethodResponse> {
        try {
            // Get payment method
            const paymentMethod = await this.prismaService.paymentMethod.findUnique({
                where: {
                    id: data.id,
                    domain: data.user.domain,
                },
                select: {
                    id: true,
                    type: true,
                    domain: true,
                    status: true,
                },
            });

            // Check if payment method exist
            if (!paymentMethod) throw new GrpcItemExitException('PAYMENT_METHOD_NOT_FOUND');

            return paymentMethod;
        } catch (error) {
            throw error;
        }
    }

    async updatePaymentMethod(
        data: IUpdatePaymentMethodRequest,
    ): Promise<IUpdatePaymentMethodResponse> {
        const { user, ...dataUpdate } = data;

        // Check role tenant
        if (user.role.toString() !== getEnumKeyByEnumValue(Role, Role.TENANT))
            throw new GrpcPermissionDeniedException('PERMISSION_DENIED');

        // Update payment method
        try {
            const paymentMethod = await this.prismaService.paymentMethod.update({
                where: {
                    id: data.id,
                    domain: user.domain,
                },
                data: {
                    ...dataUpdate,
                },
            });

            // Check payment method exist
            if (!paymentMethod) throw new GrpcItemExitException('PAYMENT_METHOD_NOT_FOUND');

            return paymentMethod;
        } catch (error) {
            throw error;
        }
    }

    async deletePaymentMethod(
        data: IDeletePaymentMethodRequest,
    ): Promise<IDeletePaymentMethodResponse> {
        const { user, ...dataDelete } = data;

        // Check role tenant
        if (user.role.toString() !== getEnumKeyByEnumValue(Role, Role.TENANT))
            throw new GrpcPermissionDeniedException('PERMISSION_DENIED');

        try {
            // Delete payment method
            const paymentMethod = await this.prismaService.paymentMethod.delete({
                where: {
                    id: dataDelete.id,
                    domain: user.domain,
                },
            });

            // Check payment method exist
            if (!paymentMethod) throw new GrpcItemExitException('PAYMENT_METHOD_NOT_FOUND');
        } catch (error) {
            throw error;
        }

        return {
            result: 'success',
        };
    }

    async listPaymentMethod(domain: string): Promise<IListPaymentMethodResponse> {
        try {
            // Get list payment method
            const paymentMethods = await this.prismaService.paymentMethod.findMany({
                where: {
                    domain,
                },
                select: {
                    id: true,
                    type: true,
                    domain: true,
                    status: true,
                },
            });

            return {
                paymentMethods: paymentMethods.map(paymentMethod => {
                    return {
                        ...paymentMethod,
                    };
                }),
            };
        } catch (error) {
            throw error;
        }
    }
}
