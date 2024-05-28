import {
    CreatePaymentMethodRequest,
    CreatePaymentMethodResponse,
    DeletePaymentMethodRequest,
    DeletePaymentMethodResponse,
    GetPaymentMethodRequest,
    GetPaymentMethodResponse,
    ListPaymentMethodRequest,
    ListPaymentMethodResponse,
    UpdatePaymentMethodRequest,
    UpdatePaymentMethodResponse,
} from 'src/proto_build/payment/payment_method_pb';

export interface ICreatePaymentMethodRequest extends CreatePaymentMethodRequest.AsObject {}
export interface ICreatePaymentMethodResponse extends CreatePaymentMethodResponse.AsObject {}

export interface IGetPaymentMethodRequest extends GetPaymentMethodRequest.AsObject {}
export interface IGetPaymentMethodResponse extends GetPaymentMethodResponse.AsObject {}

export interface IUpdatePaymentMethodRequest extends UpdatePaymentMethodRequest.AsObject {}
export interface IUpdatePaymentMethodResponse extends UpdatePaymentMethodResponse.AsObject {}

export interface IDeletePaymentMethodRequest extends DeletePaymentMethodRequest.AsObject {}
export interface IDeletePaymentMethodResponse extends DeletePaymentMethodResponse.AsObject {}

export interface IListPaymentMethodRequest extends ListPaymentMethodRequest.AsObject {}
export interface IListPaymentMethodResponse
    extends Omit<ListPaymentMethodResponse.AsObject, 'paymentMethodsList'> {
    paymentMethods: IGetPaymentMethodResponse[];
}
