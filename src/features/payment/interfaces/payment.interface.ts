import {
    CallBackVnpayResponse,
    CallbackVnpayRequest,
    CreatePaymentUrlRequest,
    CreatePaymentUrlResponse,
    GetTransactionRequest,
    GetTransactionResponse,
    Transaction,
} from 'src/proto_build/payment/payment_pb';

export interface ITransaction extends Transaction.AsObject {}

export interface ICreatePaymentUrlRequest
    extends Omit<CreatePaymentUrlRequest.AsObject, 'orderProductsIdList' | 'orderBookingIdList'> {
    orderProductsId: string[];
    orderBookingId: string[];
}
export interface ICreatePaymentUrlResponse extends CreatePaymentUrlResponse.AsObject {}

export interface IGetTransactionRequest extends GetTransactionRequest.AsObject {}
export interface IGetTransactionResponse
    extends Omit<GetTransactionResponse.AsObject, 'transactionsList'> {
    transactions: ITransaction[];
}

export interface ICallbackVnPayRequest extends CallbackVnpayRequest.AsObject {}
export interface ICallbackVnPayResponse extends CallBackVnpayResponse.AsObject {}
