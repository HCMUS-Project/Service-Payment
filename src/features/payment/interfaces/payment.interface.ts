import {
    CreatePaymentUrlRequest,
    CreatePaymentUrlResponse,
} from 'src/proto_build/payment/payment_pb';

export interface ICreatePaymentUrlRequest
    extends Omit<CreatePaymentUrlRequest.AsObject, 'orderProductsIdList' | 'orderBookingIdList'> {
    orderProductsId: string[];
    orderBookingId: string[];
}
export interface ICreatePaymentUrlResponse extends CreatePaymentUrlResponse.AsObject {}
