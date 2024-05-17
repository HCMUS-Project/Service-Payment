import {
    Bank,
    ListBankResponse,
    ListBankResquest as ListBankRequest,
} from 'src/proto_build/bank/bank_pb';

export interface IBank extends Bank.AsObject {}
export interface IListBankRequest extends ListBankRequest.AsObject {}
export interface IListBankResponse extends Omit<ListBankResponse.AsObject, 'banksList'> {
    banks: IBank[];
}
