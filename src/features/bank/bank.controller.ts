import { GrpcMethod } from '@nestjs/microservices';
import { IListBankResponse } from './interfaces/bank.interface';
import { VNPay } from 'src/util/vnpay/src/vnpay';

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
            hashAlgorithm: 'SHA512', // optional
        });

        const bankList = await vnpay.getBankList();
        console.log(bankList);

        return {
            banks: [
                {
                    name: 'Vietcombank',
                    code: 'VCB',
                },
            ],
        };
    }
}
