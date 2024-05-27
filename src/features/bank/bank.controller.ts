import { GrpcMethod } from '@nestjs/microservices';
import { IListBankResponse } from './interfaces/bank.interface';
import { VNPay, HashAlgorithm } from 'src/util/vnpay/src/index';

export class BankController {
    constructor() {}

    @GrpcMethod('BankService', 'GetBank')
    async get(): Promise<IListBankResponse> {
        const secret = 'VKGTLN3GVAW50N29CDPD93O6V07X44JQ';
        const vnpay = new VNPay({
            tmnCode: 'H0OFYK66',
            secureSecret: 'VKGTLN3GVAW50N29CDPD93O6V07X44JQ',
            vnpayHost: 'https://sandbox.vnpayment.vn',
            testMode: true, // optional
            hashAlgorithm: HashAlgorithm.SHA256,
        });

        const bankList = await vnpay.getBankList();
        console.log(bankList);

        return {
            banks: bankList.map(bank => {
                return { name: bank.bank_name, code: bank.bank_code };
            }),
        };
    }
}
